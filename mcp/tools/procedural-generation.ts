import { MapStateManager } from '../state/map-state';
import { DomainAdapter } from '../adapters/domain-adapter';
import { generateMaze, generateTerrain } from '../adapters/generator-adapter';
import { toolResult, toolError, ToolResult, DEFAULT_ELEVATION } from '../state/types';

export function getProceduralGenerationTools() {
  return [
    {
      name: 'generate_maze_hole',
      description: 'Procedurally generate a maze for a hole using recursive backtracking. Places floors, walls, spawn, hole cup, flagpole, and optional traps. Great for quick level generation.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          holeNumber: { type: 'number', minimum: 1, maximum: 18 },
          width: { type: 'number', minimum: 2, maximum: 20, description: 'Maze width in tiles' },
          height: { type: 'number', minimum: 2, maximum: 20, description: 'Maze height in tiles' },
          trapProbability: { type: 'number', minimum: 0, maximum: 1, description: 'Chance of a trap per tile (0.0-1.0)', default: 0.2 },
          wallStacks: { type: 'number', minimum: 0, maximum: 3, description: 'Wall layers', default: 1 },
          elevation: { type: 'number', default: 10.0 },
          includeSpawnAndHole: { type: 'boolean', description: 'Auto-place spawn and hole cup', default: true },
        },
        required: ['holeNumber', 'width', 'height'],
      },
    },
    {
      name: 'generate_terrain_hole',
      description: 'Procedurally generate terrain with elevation changes, ramps, and optional water. Creates natural-looking landscapes.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          holeNumber: { type: 'number', minimum: 1, maximum: 18 },
          width: { type: 'number', minimum: 2, maximum: 40, description: 'Terrain width in tiles' },
          height: { type: 'number', minimum: 2, maximum: 40, description: 'Terrain height in tiles' },
          evenness: { type: 'number', minimum: 1, maximum: 1000, description: 'Higher = flatter terrain (1=rough, 1000=flat)', default: 1 },
          steepness: { type: 'number', minimum: 0, maximum: 5, description: 'Max elevation change between adjacent tiles', default: 2 },
          wallStacks: { type: 'number', minimum: 0, maximum: 3, default: 1 },
          water: { type: 'boolean', description: 'Replace lowest-elevation tiles with water', default: false },
          includeSpawnAndHole: { type: 'boolean', description: 'Auto-place spawn and hole cup on the terrain', default: true },
        },
        required: ['holeNumber', 'width', 'height'],
      },
    },
  ];
}

export function handleProceduralGeneration(
  toolName: string,
  args: any,
  stateManager: MapStateManager,
  adapter: DomainAdapter
): ToolResult {
  const state = stateManager.getState();

  switch (toolName) {
    case 'generate_maze_hole': {
      if (args.holeNumber > state.holeCount) {
        return toolError(`Hole ${args.holeNumber} exceeds holeCount (${state.holeCount}).`);
      }

      const objects = generateMaze({
        holeNumber: args.holeNumber,
        width: args.width,
        height: args.height,
        mapName: state.levelName,
        theme: state.theme,
        trapProbability: args.trapProbability ?? 0.2,
        wallStacks: args.wallStacks ?? state.wallStacks,
        elevation: args.elevation ?? DEFAULT_ELEVATION,
        includeSpawnAndHole: args.includeSpawnAndHole !== false,
      });

      const added = stateManager.addObjects(objects);

      return toolResult({
        success: true,
        holeNumber: args.holeNumber,
        objectCount: added.length,
        mazeSize: { width: args.width, height: args.height },
      });
    }

    case 'generate_terrain_hole': {
      if (args.holeNumber > state.holeCount) {
        return toolError(`Hole ${args.holeNumber} exceeds holeCount (${state.holeCount}).`);
      }

      const objects = generateTerrain({
        holeNumber: args.holeNumber,
        width: args.width,
        height: args.height,
        mapName: state.levelName,
        theme: state.theme,
        evenness: args.evenness ?? 1,
        steepness: args.steepness ?? 2,
        wallStacks: args.wallStacks ?? state.wallStacks,
        water: args.water ?? false,
      });

      // If spawn/hole requested, add them at first and last terrain tiles
      if (args.includeSpawnAndHole !== false) {
        const floors = objects.filter((o) => o.type === 'floor');
        if (floors.length >= 2) {
          const firstFloor = floors[0];
          const lastFloor = floors[floors.length - 1];
          objects.push(
            adapter.createSpawn(
              firstFloor.gridX ?? 0,
              firstFloor.gridZ ?? 0,
              firstFloor.pY,
              args.holeNumber
            ),
            adapter.createHole(
              lastFloor.gridX ?? 0,
              lastFloor.gridZ ?? 0,
              lastFloor.pY,
              args.holeNumber
            ),
            adapter.createFlagpole(
              lastFloor.gridX ?? 0,
              lastFloor.gridZ ?? 0,
              lastFloor.pY,
              args.holeNumber
            )
          );
        }
      }

      const added = stateManager.addObjects(objects);

      // Compute elevation range
      let minElev = Infinity, maxElev = -Infinity;
      for (const obj of added) {
        if (obj.pY < minElev) minElev = obj.pY;
        if (obj.pY > maxElev) maxElev = obj.pY;
      }

      return toolResult({
        success: true,
        holeNumber: args.holeNumber,
        objectCount: added.length,
        terrainSize: { width: args.width, height: args.height },
        elevationRange: { min: minElev, max: maxElev },
      });
    }

    default:
      return toolError(`Unknown tool: ${toolName}`);
  }
}
