import { MapStateManager } from '../state/map-state';
import { toolResult, toolError, ToolResult, ObjectType } from '../state/types';

export function getEditingTools() {
  return [
    {
      name: 'remove_objects_in_area',
      description: 'Remove objects within a grid area. Can filter by object type.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          gridX: { type: 'number', description: 'Center grid X' },
          gridZ: { type: 'number', description: 'Center grid Z' },
          radius: { type: 'number', minimum: 0, description: 'Radius in grid tiles (0 = single tile)', default: 0 },
          objectType: {
            type: 'string',
            description: 'Only remove this type (e.g., "floor", "wallH", "trap_mine"). Omit to remove all.',
          },
        },
        required: ['gridX', 'gridZ'],
      },
    },
    {
      name: 'list_objects',
      description: 'List placed objects with optional filtering. Returns positions and types.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          holeNumber: { type: 'number', description: 'Filter by hole number' },
          objectType: { type: 'string', description: 'Filter by object type' },
          limit: { type: 'number', minimum: 1, maximum: 200, description: 'Max results', default: 50 },
        },
      },
    },
    {
      name: 'undo_last_action',
      description: 'Undo the last placement action. Removes all objects added by the last tool call.',
      inputSchema: {
        type: 'object' as const,
        properties: {},
      },
    },
  ];
}

export function handleEditing(
  toolName: string,
  args: any,
  stateManager: MapStateManager
): ToolResult {
  switch (toolName) {
    case 'remove_objects_in_area': {
      const removed = stateManager.removeObjects({
        gridX: args.gridX,
        gridZ: args.gridZ,
        radius: args.radius ?? 0,
        type: args.objectType as ObjectType | undefined,
      });
      return toolResult({ success: true, removedCount: removed });
    }

    case 'list_objects': {
      const objects = stateManager.getObjects({
        holeNumber: args.holeNumber,
        type: args.objectType as ObjectType | undefined,
        limit: args.limit ?? 50,
      });

      const result = objects.map((o) => ({
        id: o.id,
        type: o.type,
        holeNumber: o.holeNumber,
        gridPosition: o.gridX !== undefined ? { gridX: o.gridX, gridZ: o.gridZ } : null,
        worldPosition: { x: o.pX, y: o.pY, z: o.pZ },
        hidden: o.hidden || undefined,
      }));

      return toolResult({
        objects: result,
        totalCount: stateManager.getObjects({
          holeNumber: args.holeNumber,
          type: args.objectType as ObjectType | undefined,
        }).length,
        showing: result.length,
      });
    }

    case 'undo_last_action': {
      const { undone } = stateManager.undo();
      if (undone === 0) {
        return toolResult({ success: true, message: 'Nothing to undo.' });
      }
      return toolResult({ success: true, objectsRemoved: undone });
    }

    default:
      return toolError(`Unknown tool: ${toolName}`);
  }
}
