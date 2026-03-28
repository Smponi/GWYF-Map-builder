import { MapStateManager } from '../state/map-state';
import { toolResult, toolError, ToolResult, MAP_BOUNDS, GRID_SPACING } from '../state/types';

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
      name: 'get_object_catalog',
      description: 'Get the complete catalog of available objects, themes, traps, and map constraints. Useful for understanding what can be placed.',
      inputSchema: {
        type: 'object' as const,
        properties: {},
      },
    },
  ];
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

    case 'get_object_catalog': {
      return toolResult({
        terrainObjects: [
          { type: 'floor', description: 'Basic 6x6 floor tile. The main building block.', themedName: '6x6_Base_{theme}' },
          { type: 'hole', description: 'Hole cup - ball target. 6x6 tile with an indent.', themedName: '6x6HoleFlat_Base_{theme}' },
          { type: 'water', description: 'Water hazard tile. Always uses Pirate theme.', fixedName: 'Pirate_Water' },
        ],
        structuralObjects: [
          { type: 'wallH', description: 'Horizontal wall (1x6). Placed at tile edges.', themedName: '1x6_Wall_{theme}' },
          { type: 'wallV', description: 'Vertical wall (1x6). 90-degree rotated.', themedName: '1x6_Wall_{theme}' },
          { type: 'foundationWallH', description: 'Horizontal foundation wall. Hardcoded Forest theme.', fixedName: '6x6Foundation_Wall_Forest' },
          { type: 'foundationWallV', description: 'Vertical foundation wall. Hardcoded Forest theme.', fixedName: '6x6Foundation_Wall_Forest' },
        ],
        ramps: [
          { type: 'ramp2', description: 'Standard ramp (+2 elevation). Hardcoded Forest. 4 directions.', fixedName: '6x6Ramp+2_Base_Forest', elevationChange: 2 },
          { type: 'sramp2', description: 'S-curve ramp. Hardcoded Forest.', fixedName: '6x6_S-ramp_Forest' },
          { type: 'largescurve3', description: 'Large S-curve ramp. Hardcoded Forest.', fixedName: 'Large_SCurve_Forest' },
          { type: 'halframp', description: 'Half ramp. No theme.', fixedName: 'Base_6x6_HalfRamp' },
        ],
        gameObjects: [
          { type: 'spawn', description: 'Player spawn point. One per hole required.', fixedName: 'SingleSpawn' },
          { type: 'flagpole', description: 'Hole flag marker. One per hole required.', themedName: 'FlagPole_{theme}' },
          { type: 'dropdownTube', description: 'Vertical tube for falling between elevations.', themedName: '6x6_DropdownTube_{theme}' },
        ],
        traps: [
          { type: 'flipgate', description: 'Flipping gate obstacle. H or V orientation.', hasFloor: false },
          { type: 'fourwingspinner', description: 'Four-armed spinning obstacle.', hasFloor: false },
          { type: 'ghostspinner', description: 'Ghost spinning obstacle. Floats 3 units above.', hasFloor: false },
          { type: 'lightningstrike', description: 'Lightning hazard.', hasFloor: false },
          { type: 'mine', description: 'Explosive mine.', hasFloor: false },
          { type: 'oildrum', description: 'Oil drum obstacle.', hasFloor: false },
          { type: 'rock', description: 'Rock obstacle.', hasFloor: false },
          { type: 'spinningfloor', description: 'Spinning floor platform. Includes its own floor.', hasFloor: true },
          { type: 'walkingturtle', description: 'Moving turtle hazard.', hasFloor: false },
          { type: 'webspinner', description: 'Web-spinning hazard. Includes its own floor.', hasFloor: true },
        ],
        themes: ['Forest', 'Oasis', 'Space', 'Pirate', 'Haunted', 'Candy'],
        themeWarning: 'Some objects (ramps, foundations, water) have hardcoded themes and will not change appearance with the map theme.',
        constraints: {
          gridSpacing: GRID_SPACING,
          mapBounds: MAP_BOUNDS,
          maxHoles: 18,
          defaultElevation: 10.0,
          coordinateSystem: 'Grid coordinates: integers, each unit = 6 world units. Grid (0,0) = world origin. Elevation in world units (default 10.0).',
        },
      });
    }

    default:
      return toolError(`Unknown tool: ${toolName}`);
  }
}
