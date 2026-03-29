import { MapStateManager } from '../state/map-state';
import { MapObject, toolResult, toolError, ToolResult, MAP_BOUNDS, GRID_SPACING, gridToWorld } from '../state/types';
import { FOREST_ITEM_CATALOG, getCategories, getItemsByCategory } from '../catalog/forest-items';

export function getValidationTools() {
  return [
    {
      name: 'validate_map',
      description: 'Validate the entire map: check bounds, required elements per hole, and report warnings. Run this before saving.',
      inputSchema: {
        type: 'object' as const,
        properties: {},
      },
    },
    {
      name: 'validate_hole',
      description: 'Validate a specific hole: check it has spawn, hole cup, and flagpole.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          holeNumber: { type: 'number', minimum: 1, maximum: 18 },
        },
        required: ['holeNumber'],
      },
    },
    {
      name: 'validate_playability',
      description: 'Check if a hole is physically playable: verifies that a path exists from spawn to hole cup via connected floor/ramp tiles. Also estimates par based on path length and difficulty.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          holeNumber: { type: 'number', minimum: 1, maximum: 18 },
        },
        required: ['holeNumber'],
      },
    },
    {
      name: 'get_object_catalog',
      description: 'Get the complete catalog of available objects, themes, traps, and map constraints. Useful for understanding what can be placed.',
      inputSchema: {
        type: 'object' as const,
        properties: {},
      },
    },
  ];
}

// Walkable surface types - objects the ball can roll on
const WALKABLE_TYPES = new Set([
  'floor', 'hole', 'ramp2', 'sramp2', 'largeSCurve3', 'halfRamp',
  'dropdownTube', 'spinningfloor', 'webspinner',
]);

// Build a grid of walkable positions from objects, returns adjacency info
function buildWalkabilityGrid(objects: MapObject[]): {
  walkable: Map<string, { elevation: number; type: string; obj: MapObject }>;
  ramps: Map<string, { direction: string; lowElev: number; highElev: number }>;
} {
  const walkable = new Map<string, { elevation: number; type: string; obj: MapObject }>();
  const ramps = new Map<string, { direction: string; lowElev: number; highElev: number }>();

  for (const obj of objects) {
    if (!WALKABLE_TYPES.has(obj.type)) continue;

    // Use world position rounded to grid
    const gx = Math.round(obj.pX / GRID_SPACING);
    const gz = Math.round(obj.pZ / GRID_SPACING);
    const key = `${gx},${gz}`;

    walkable.set(key, { elevation: obj.pY, type: obj.type, obj });

    // Track ramp connectivity (ramps connect two different elevations)
    if (obj.type === 'ramp2') {
      // Ramp2 has +2 offset baked into pY, actual low end = pY - 2
      const lowElev = obj.pY - 2;
      const highElev = obj.pY;

      // Determine direction from rotation
      let dir = 'unknown';
      if (Math.abs(obj.rW - 1.0) < 0.01 && Math.abs(obj.rY) < 0.01) dir = 'west';
      else if (Math.abs(obj.rW - 0.7071) < 0.01 && Math.abs(obj.rY - 0.7071) < 0.01) dir = 'north';
      else if (Math.abs(obj.rW) < 0.01 && Math.abs(obj.rY - 1.0) < 0.01) dir = 'east';
      else if (Math.abs(obj.rW + 0.7071) < 0.01 && Math.abs(obj.rY - 0.7071) < 0.01) dir = 'south';

      ramps.set(key, { direction: dir, lowElev, highElev });
    }

    // Dropdown tubes connect to tiles below
    if (obj.type === 'dropdownTube') {
      // A dropdown tube allows vertical movement - mark as special
      ramps.set(key, { direction: 'down', lowElev: 0, highElev: obj.pY });
    }
  }

  return { walkable, ramps };
}

// BFS pathfinding from spawn to hole
function findPath(
  spawnObj: MapObject,
  holeObj: MapObject,
  walkable: Map<string, { elevation: number; type: string; obj: MapObject }>,
  ramps: Map<string, { direction: string; lowElev: number; highElev: number }>
): { reachable: boolean; pathLength: number; visited: number } {
  const spawnGx = Math.round(spawnObj.pX / GRID_SPACING);
  const spawnGz = Math.round(spawnObj.pZ / GRID_SPACING);
  const holeGx = Math.round(holeObj.pX / GRID_SPACING);
  const holeGz = Math.round(holeObj.pZ / GRID_SPACING);

  const startKey = `${spawnGx},${spawnGz}`;
  const targetKey = `${holeGx},${holeGz}`;

  if (!walkable.has(startKey)) {
    return { reachable: false, pathLength: 0, visited: 0 };
  }

  const visited = new Set<string>();
  const queue: Array<{ key: string; gx: number; gz: number; dist: number }> = [
    { key: startKey, gx: spawnGx, gz: spawnGz, dist: 0 },
  ];
  visited.add(startKey);

  const NEIGHBORS = [
    { dx: 1, dz: 0 },
    { dx: -1, dz: 0 },
    { dx: 0, dz: 1 },
    { dx: 0, dz: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.key === targetKey) {
      return { reachable: true, pathLength: current.dist, visited: visited.size };
    }

    const currentTile = walkable.get(current.key);
    if (!currentTile) continue;
    const currentElev = currentTile.elevation;

    for (const { dx, dz } of NEIGHBORS) {
      const nx = current.gx + dx;
      const nz = current.gz + dz;
      const nKey = `${nx},${nz}`;

      if (visited.has(nKey)) continue;
      if (!walkable.has(nKey)) continue;

      const neighborTile = walkable.get(nKey)!;
      const neighborElev = neighborTile.elevation;

      // Check if movement is possible:
      // 1. Same elevation -> always walkable
      // 2. Ramp present -> connects different elevations
      // 3. Small elevation difference (ball can roll slightly up/down) -> allow <=2 diff
      // 4. Dropdown tube -> allows any downward movement
      const elevDiff = Math.abs(currentElev - neighborElev);
      const currentRamp = ramps.get(current.key);
      const neighborRamp = ramps.get(nKey);
      const isDropdown = currentRamp?.direction === 'down' || neighborRamp?.direction === 'down';

      const canTraverse =
        elevDiff <= 2 ||  // Ball physics: small elevation changes are ok
        currentRamp !== undefined ||  // Current tile is a ramp
        neighborRamp !== undefined ||  // Neighbor is a ramp
        isDropdown ||  // Dropdown tube
        (neighborElev < currentElev);  // Ball rolls downhill

      if (canTraverse) {
        visited.add(nKey);
        queue.push({ key: nKey, gx: nx, gz: nz, dist: current.dist + 1 });
      }
    }

    // Special: dropdown tubes can connect to tiles directly below (any tile at lower elevation at same X,Z)
    if (ramps.get(current.key)?.direction === 'down') {
      // Find all walkable tiles at same X,Z but different elevation
      for (const [key, tile] of walkable) {
        if (key === current.key || visited.has(key)) continue;
        const [kx, kz] = key.split(',').map(Number);
        if (kx === current.gx && kz === current.gz && tile.elevation < currentElev) {
          visited.add(key);
          queue.push({ key, gx: kx, gz: kz, dist: current.dist + 1 });
        }
      }
    }
  }

  return { reachable: false, pathLength: 0, visited: visited.size };
}

// Estimate par based on path length and difficulty factors
function estimatePar(
  pathLength: number,
  objects: MapObject[],
  holeObj: MapObject,
  spawnObj: MapObject
): { par: number; reasoning: string } {
  if (pathLength === 0) return { par: 99, reasoning: 'No valid path found' };

  // Base par: roughly 1 stroke per 3-4 tiles of path
  let basePar = Math.ceil(pathLength / 3.5);

  // Minimum par is 2 (even the shortest hole needs at least 2 strokes realistically)
  basePar = Math.max(2, basePar);

  // Difficulty modifiers
  let difficulty = 0;
  let reasons: string[] = [`Base: ${basePar} (path length ${pathLength})`];

  // Elevation changes add difficulty
  const elevDiff = Math.abs(holeObj.pY - spawnObj.pY);
  if (elevDiff > 4) {
    difficulty += 1;
    reasons.push('+1 elevation change');
  }

  // Traps add difficulty
  const trapTypes = new Set(['flipgate', 'fourwingspinner', 'ghostspinner', 'lightningstrike',
    'mine', 'oildrum', 'rock', 'spinningfloor', 'walkingturtle', 'webspinner']);
  const trapCount = objects.filter((o) => trapTypes.has(o.type)).length;
  if (trapCount > 3) {
    difficulty += 1;
    reasons.push(`+1 many traps (${trapCount})`);
  }

  // Narrow paths (few floor tiles relative to path length) = harder
  const floorCount = objects.filter((o) => o.type === 'floor' || o.type === 'hole').length;
  if (floorCount > 0 && pathLength / floorCount > 0.8) {
    difficulty += 1;
    reasons.push('+1 narrow/linear layout');
  }

  // Water hazards
  const waterCount = objects.filter((o) => o.type === 'water').length;
  if (waterCount > 0) {
    difficulty += 1;
    reasons.push(`+1 water hazards (${waterCount})`);
  }

  const par = Math.min(basePar + difficulty, 15); // Cap at 15 (realistic max for mini-golf)
  return { par, reasoning: reasons.join(', ') };
}

export function handleValidation(
  toolName: string,
  args: any,
  stateManager: MapStateManager
): ToolResult {
  switch (toolName) {
    case 'validate_map': {
      const state = stateManager.getState();
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check each hole
      for (let h = 1; h <= state.holeCount; h++) {
        const holeObjs = state.objects.filter((o) => o.holeNumber === h);
        if (holeObjs.length === 0) {
          errors.push(`Hole ${h}: no objects placed`);
          continue;
        }
        if (!holeObjs.some((o) => o.type === 'spawn')) errors.push(`Hole ${h}: missing spawn point`);
        if (!holeObjs.some((o) => o.type === 'hole')) errors.push(`Hole ${h}: missing hole cup`);
        if (!holeObjs.some((o) => o.type === 'flagpole')) errors.push(`Hole ${h}: missing flagpole`);
        if (holeObjs.filter((o) => o.type === 'spawn').length > 1) warnings.push(`Hole ${h}: multiple spawn points`);
      }

      // Check bounds
      let outOfBounds = 0;
      for (const obj of state.objects) {
        if (obj.pX < MAP_BOUNDS.min || obj.pX > MAP_BOUNDS.max ||
            obj.pZ < MAP_BOUNDS.min || obj.pZ > MAP_BOUNDS.max) {
          outOfBounds++;
        }
      }
      if (outOfBounds > 0) {
        errors.push(`${outOfBounds} objects are outside map bounds (${MAP_BOUNDS.min} to ${MAP_BOUNDS.max})`);
      }

      // Object count warning
      if (state.objects.length > 5000) {
        warnings.push(`High object count (${state.objects.length}). GWYF may have performance issues with very large maps.`);
      }

      return toolResult({
        valid: errors.length === 0,
        errors,
        warnings,
        stats: {
          totalObjects: state.objects.length,
          holesConfigured: state.holeCount,
          outOfBounds,
        },
      });
    }

    case 'validate_hole': {
      const state = stateManager.getState();
      const holeNumber = args.holeNumber;
      const holeObjs = state.objects.filter((o) => o.holeNumber === holeNumber);
      const errors: string[] = [];
      const warnings: string[] = [];

      const hasSpawn = holeObjs.some((o) => o.type === 'spawn');
      const hasHole = holeObjs.some((o) => o.type === 'hole');
      const hasFlagpole = holeObjs.some((o) => o.type === 'flagpole');

      if (!hasSpawn) errors.push('Missing spawn point');
      if (!hasHole) errors.push('Missing hole cup');
      if (!hasFlagpole) errors.push('Missing flagpole');

      const hiddenHoles = holeObjs.filter((o) => o.type === 'hole' && o.hidden);

      // Compute bounds
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const obj of holeObjs) {
        minX = Math.min(minX, obj.pX);
        maxX = Math.max(maxX, obj.pX);
        minZ = Math.min(minZ, obj.pZ);
        maxZ = Math.max(maxZ, obj.pZ);
      }

      return toolResult({
        valid: errors.length === 0,
        holeNumber,
        hasSpawn,
        hasHole,
        hasFlagpole,
        hiddenHoles: hiddenHoles.length,
        objectCount: holeObjs.length,
        bounds: holeObjs.length > 0 ? { minX, maxX, minZ, maxZ } : null,
        errors,
        warnings,
      });
    }

    case 'validate_playability': {
      const state = stateManager.getState();
      const holeNumber = args.holeNumber;
      const holeObjs = state.objects.filter((o) => o.holeNumber === holeNumber);

      const spawnObj = holeObjs.find((o) => o.type === 'spawn');
      const holeObj = holeObjs.find((o) => o.type === 'hole' && !o.hidden);
      const hiddenHoleObjs = holeObjs.filter((o) => o.type === 'hole' && o.hidden);

      if (!spawnObj) return toolError(`Hole ${holeNumber}: no spawn point found`);
      if (!holeObj) return toolError(`Hole ${holeNumber}: no hole cup found`);

      // Build walkability grid and find path
      const { walkable, ramps } = buildWalkabilityGrid(holeObjs);
      const mainPath = findPath(spawnObj, holeObj, walkable, ramps);

      // Check hidden holes reachability too
      const hiddenHoleResults = hiddenHoleObjs.map((hh) => {
        const path = findPath(spawnObj, hh, walkable, ramps);
        return {
          position: { worldX: hh.pX, worldZ: hh.pZ, elevation: hh.pY },
          reachable: path.reachable,
          pathLength: path.pathLength,
        };
      });

      // Estimate par
      const parEstimate = estimatePar(mainPath.pathLength, holeObjs, holeObj, spawnObj);

      // Detect isolated floor tiles (walkable but not connected to spawn)
      const isolatedTiles = walkable.size - mainPath.visited;

      const warnings: string[] = [];
      if (isolatedTiles > 0) {
        warnings.push(`${isolatedTiles} walkable tiles are not reachable from spawn (isolated areas)`);
      }
      if (!mainPath.reachable) {
        warnings.push('The ball CANNOT reach the hole from spawn! Check for missing floor tiles or blocked paths.');
      }
      for (const hh of hiddenHoleResults) {
        if (!hh.reachable) {
          warnings.push(`Hidden hole at (${hh.position.worldX}, ${hh.position.worldZ}) is not reachable from spawn`);
        }
      }

      // Check spawn has floor underneath
      const spawnGx = Math.round(spawnObj.pX / GRID_SPACING);
      const spawnGz = Math.round(spawnObj.pZ / GRID_SPACING);
      const spawnKey = `${spawnGx},${spawnGz}`;
      if (!walkable.has(spawnKey)) {
        warnings.push('Spawn point has no floor tile underneath - ball will fall!');
      }

      return toolResult({
        holeNumber,
        playable: mainPath.reachable,
        mainPath: {
          reachable: mainPath.reachable,
          pathLength: mainPath.pathLength,
          tilesExplored: mainPath.visited,
          totalWalkableTiles: walkable.size,
          isolatedTiles,
        },
        hiddenHoles: hiddenHoleResults,
        parEstimate: {
          recommended: parEstimate.par,
          reasoning: parEstimate.reasoning,
        },
        warnings,
      });
    }

    case 'get_object_catalog': {
      const categories = getCategories();
      const overview = categories.map((cat) => ({
        category: cat,
        count: getItemsByCategory(cat).length,
        examples: getItemsByCategory(cat).slice(0, 3).map((i) => i.obName),
      }));

      return toolResult({
        totalItems: FOREST_ITEM_CATALOG.length,
        categories: overview,
        themes: ['Forest', 'Oasis', 'Space', 'Pirate', 'Haunted', 'Candy'],
        constraints: {
          gridSpacing: GRID_SPACING,
          mapBounds: MAP_BOUNDS,
          maxHoles: 18,
          defaultElevation: 10.0,
          coordinateSystem: 'Grid coordinates: integers, each unit = 6 world units. Grid (0,0) = world origin. Elevation in world units (default 10.0).',
        },
        note: 'Use get_forest_catalog with a category filter for detailed item listings.',
      });
    }

    default:
      return toolError(`Unknown tool: ${toolName}`);
  }
}
