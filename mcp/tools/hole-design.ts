import { MapStateManager } from '../state/map-state';
import { DomainAdapter } from '../adapters/domain-adapter';
import { toolResult, toolError, ToolResult, DEFAULT_ELEVATION } from '../state/types';

export function getHoleDesignTools() {
  return [
    {
      name: 'place_spawn',
      description: 'Place a player spawn point. Each hole needs exactly one spawn. The spawn is automatically named "Spawn N" based on the hole number.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          gridX: { type: 'number' },
          gridZ: { type: 'number' },
          elevation: { type: 'number', default: 10.0 },
          holeNumber: { type: 'number', description: 'Override hole number (defaults to current hole)' },
          par: { type: 'number', description: 'Par for this hole', default: 99 },
        },
        required: ['gridX', 'gridZ'],
      },
    },
    {
      name: 'place_hole_cup',
      description: 'Place a hole cup (the target the ball falls into). Each hole needs exactly one. Can be marked as hidden for secret hole-in-one spots.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          gridX: { type: 'number' },
          gridZ: { type: 'number' },
          elevation: { type: 'number', default: 10.0 },
          hidden: { type: 'boolean', description: 'Mark as a hidden hole-in-one location', default: false },
        },
        required: ['gridX', 'gridZ'],
      },
    },
    {
      name: 'place_flagpole',
      description: 'Place a flagpole marking the hole location. Should be placed at the same position as the hole cup.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          gridX: { type: 'number' },
          gridZ: { type: 'number' },
          elevation: { type: 'number', default: 10.0 },
        },
        required: ['gridX', 'gridZ'],
      },
    },
    {
      name: 'create_complete_hole',
      description: 'Create a complete hole with spawn, floor at spawn, hole cup, and flagpole in one operation. Optionally add a hidden hole-in-one location.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          holeNumber: { type: 'number', minimum: 1, maximum: 18, description: 'Which hole number (1-18)' },
          spawnGridX: { type: 'number' },
          spawnGridZ: { type: 'number' },
          holeGridX: { type: 'number' },
          holeGridZ: { type: 'number' },
          elevation: { type: 'number', default: 10.0 },
          par: { type: 'number', default: 99 },
          hiddenHolePosition: {
            type: 'object',
            properties: {
              gridX: { type: 'number' },
              gridZ: { type: 'number' },
              elevation: { type: 'number' },
            },
            required: ['gridX', 'gridZ'],
            description: 'Optional secret hole-in-one position',
          },
        },
        required: ['holeNumber', 'spawnGridX', 'spawnGridZ', 'holeGridX', 'holeGridZ'],
      },
    },
  ];
}

export function handleHoleDesign(
  toolName: string,
  args: any,
  stateManager: MapStateManager,
  adapter: DomainAdapter
): ToolResult {
  const state = stateManager.getState();
  const elevation = args.elevation ?? DEFAULT_ELEVATION;

  switch (toolName) {
    case 'place_spawn': {
      const holeNum = args.holeNumber ?? state.currentHoleNumber;
      const obj = stateManager.addObject(
        adapter.createSpawn(args.gridX, args.gridZ, elevation, holeNum, args.par ?? 99)
      );
      return toolResult({
        success: true,
        objectId: obj.id,
        spawnName: obj.spawnName,
        holeNumber: holeNum,
      });
    }

    case 'place_hole_cup': {
      const holeNum = state.currentHoleNumber;
      const obj = stateManager.addObject(
        adapter.createHole(args.gridX, args.gridZ, elevation, holeNum, args.hidden)
      );
      return toolResult({
        success: true,
        objectId: obj.id,
        hidden: args.hidden ?? false,
      });
    }

    case 'place_flagpole': {
      const holeNum = state.currentHoleNumber;
      const obj = stateManager.addObject(
        adapter.createFlagpole(args.gridX, args.gridZ, elevation, holeNum)
      );
      return toolResult({ success: true, objectId: obj.id });
    }

    case 'create_complete_hole': {
      const holeNum = args.holeNumber;
      const elev = elevation;

      if (holeNum > state.holeCount) {
        return toolError(`Hole ${holeNum} exceeds holeCount (${state.holeCount}).`);
      }

      const objects = [
        adapter.createSpawn(args.spawnGridX, args.spawnGridZ, elev, holeNum, args.par ?? 99),
        adapter.createFloor(args.spawnGridX, args.spawnGridZ, elev, holeNum),
        adapter.createHole(args.holeGridX, args.holeGridZ, elev, holeNum),
        adapter.createFlagpole(args.holeGridX, args.holeGridZ, elev, holeNum),
      ];

      let hasHiddenHole = false;
      if (args.hiddenHolePosition) {
        const hp = args.hiddenHolePosition;
        const hiddenElev = hp.elevation ?? elev;
        objects.push(adapter.createHole(hp.gridX, hp.gridZ, hiddenElev, holeNum, true));
        objects.push(adapter.createFlagpole(hp.gridX, hp.gridZ, hiddenElev, holeNum));
        hasHiddenHole = true;
      }

      const added = stateManager.addObjects(objects);
      return toolResult({
        success: true,
        holeNumber: holeNum,
        objectIds: added.map((o) => o.id),
        objectCount: added.length,
        hasHiddenHole,
      });
    }

    default:
      return toolError(`Unknown tool: ${toolName}`);
  }
}
