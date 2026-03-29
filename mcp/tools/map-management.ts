import * as fs from 'fs';
import * as path from 'path';
import { MapStateManager } from '../state/map-state';
import { DomainAdapter } from '../adapters/domain-adapter';
import { Theme, toolResult, toolError, ToolResult } from '../state/types';

export function getMapManagementTools() {
  return [
    {
      name: 'create_map',
      description: 'Create a new map. This resets any existing map state. Must be called before placing any objects.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          name: { type: 'string', description: 'Level name displayed in-game' },
          description: { type: 'string', description: 'Map description', default: 'AI-generated GWYF map' },
          theme: { type: 'string', enum: ['Forest', 'Oasis', 'Space', 'Pirate', 'Haunted', 'Candy'], description: 'Visual theme (affects object textures). Note: some objects like ramps and water are hardcoded to Forest/Pirate.', default: 'Forest' },
          holeCount: { type: 'number', minimum: 1, maximum: 18, description: 'Number of holes (1-18)', default: 1 },
          music: { type: 'number', minimum: 0, maximum: 15, description: 'Music track index', default: 8 },
          skybox: { type: 'number', minimum: 0, maximum: 15, description: 'Skybox index', default: 9 },
        },
        required: ['name'],
      },
    },
    {
      name: 'save_map',
      description: 'Save the current map to a file in GWYF-compatible JSON format. Runs validation first and reports warnings.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          outputPath: { type: 'string', description: 'File path to save. Defaults to "Map" in project root.' },
        },
      },
    },
    {
      name: 'get_map_info',
      description: 'Get current map statistics: name, theme, hole count, object counts by type, and per-hole status (spawn/hole/flagpole presence).',
      inputSchema: {
        type: 'object' as const,
        properties: {},
      },
    },
    {
      name: 'set_map_metadata',
      description: 'Update map metadata without affecting placed objects.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          name: { type: 'string', description: 'New level name' },
          description: { type: 'string', description: 'New description' },
          theme: { type: 'string', enum: ['Forest', 'Oasis', 'Space', 'Pirate', 'Haunted', 'Candy'] },
          music: { type: 'number', minimum: 0, maximum: 15 },
          skybox: { type: 'number', minimum: 0, maximum: 15 },
          wallStacks: { type: 'number', minimum: 0, maximum: 3, description: 'Default wall stack count for generated content' },
        },
      },
    },
    {
      name: 'switch_hole',
      description: 'Switch the active hole number. All subsequent placement operations will be tagged with this hole number.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          holeNumber: { type: 'number', minimum: 1, maximum: 18, description: 'Hole number to switch to' },
        },
        required: ['holeNumber'],
      },
    },
  ];
}

export function handleMapManagement(
  toolName: string,
  args: any,
  stateManager: MapStateManager,
  adapter: DomainAdapter
): ToolResult {
  switch (toolName) {
    case 'create_map': {
      const theme = (args.theme || 'Forest') as Theme;
      adapter.setTheme(theme);
      const state = stateManager.create(
        args.name,
        theme,
        args.holeCount ?? 1,
        args.music ?? 8,
        args.skybox ?? 9,
        args.description ?? 'AI-generated GWYF map'
      );
      return toolResult({
        success: true,
        mapName: state.levelName,
        theme: state.theme,
        holeCount: state.holeCount,
        gridInfo: {
          gridSpacing: 6,
          boundsMin: -245,
          boundsMax: 245,
          gridRange: 'approximately -40 to 40 in each axis',
          elevationDefault: 10.0,
        },
      });
    }

    case 'save_map': {
      const state = stateManager.getState();
      const json = stateManager.serialize();
      const outputPath = args.outputPath || path.join(process.cwd(), 'Map');
      fs.writeFileSync(outputPath, json);

      // Validation warnings
      const warnings: string[] = [];
      for (let h = 1; h <= state.holeCount; h++) {
        const holeObjs = state.objects.filter((o) => o.holeNumber === h);
        if (!holeObjs.some((o) => o.type === 'spawn')) warnings.push(`Hole ${h}: missing spawn point`);
        if (!holeObjs.some((o) => o.type === 'hole')) warnings.push(`Hole ${h}: missing hole cup`);
        if (!holeObjs.some((o) => o.type === 'flagpole')) warnings.push(`Hole ${h}: missing flagpole`);
      }

      return toolResult({
        success: true,
        path: outputPath,
        objectCount: state.objects.length,
        warnings,
      });
    }

    case 'get_map_info': {
      return toolResult(stateManager.getInfo());
    }

    case 'set_map_metadata': {
      const state = stateManager.getState();
      const updated: string[] = [];

      if (args.name !== undefined) { state.levelName = args.name; updated.push('name'); }
      if (args.description !== undefined) { state.description = args.description; updated.push('description'); }
      if (args.theme !== undefined) { state.theme = args.theme; adapter.setTheme(args.theme); updated.push('theme'); }
      if (args.music !== undefined) { state.music = args.music; updated.push('music'); }
      if (args.skybox !== undefined) { state.skybox = args.skybox; updated.push('skybox'); }
      if (args.wallStacks !== undefined) { state.wallStacks = args.wallStacks; updated.push('wallStacks'); }

      return toolResult({ success: true, updated });
    }

    case 'switch_hole': {
      const state = stateManager.getState();
      if (args.holeNumber > state.holeCount) {
        return toolError(`Hole ${args.holeNumber} exceeds holeCount (${state.holeCount}). Increase holeCount first via set_map_metadata or create_map.`);
      }
      state.currentHoleNumber = args.holeNumber;
      const existing = state.objects.filter((o) => o.holeNumber === args.holeNumber).length;
      return toolResult({ success: true, currentHole: args.holeNumber, existingObjects: existing });
    }

    default:
      return toolError(`Unknown tool: ${toolName}`);
  }
}
