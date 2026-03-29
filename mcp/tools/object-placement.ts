import { MapStateManager } from '../state/map-state';
import { DomainAdapter } from '../adapters/domain-adapter';
import { toolResult, toolError, ToolResult, DEFAULT_ELEVATION, Direction, RampType, TrapType, WallOrientation, gridToWorld, GRID_SPACING } from '../state/types';

export function getObjectPlacementTools() {
  return [
    {
      name: 'place_floor',
      description: 'Place a single 6x6 floor tile at the given grid position.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          gridX: { type: 'number', description: 'Grid X coordinate (integer)' },
          gridZ: { type: 'number', description: 'Grid Z coordinate (integer)' },
          elevation: { type: 'number', description: 'World Y elevation', default: 10.0 },
        },
        required: ['gridX', 'gridZ'],
      },
    },
    {
      name: 'place_wall',
      description: 'Place a wall on a specific side of a tile. Walls are 1x6 units and placed at the tile edge.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          gridX: { type: 'number', description: 'Grid X of the tile' },
          gridZ: { type: 'number', description: 'Grid Z of the tile' },
          side: { type: 'string', enum: ['north', 'south', 'east', 'west'], description: 'Which edge of the tile to place the wall on' },
          elevation: { type: 'number', default: 10.0 },
        },
        required: ['gridX', 'gridZ', 'side'],
      },
    },
    {
      name: 'place_ramp',
      description: 'Place a ramp tile. The ramp ascends TOWARD the specified direction. Optionally includes foundation walls.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          gridX: { type: 'number' },
          gridZ: { type: 'number' },
          direction: { type: 'string', enum: ['north', 'south', 'east', 'west'], description: 'Direction the ramp ascends toward' },
          elevation: { type: 'number', description: 'Elevation at the LOW end of the ramp', default: 10.0 },
          type: { type: 'string', enum: ['ramp2', 'sramp2', 'largescurve3', 'halframp'], default: 'ramp2' },
          includeFoundation: { type: 'boolean', description: 'Add foundation walls alongside the ramp', default: true },
          includeWalls: { type: 'boolean', description: 'Add ramp walls (side walls)', default: false },
        },
        required: ['gridX', 'gridZ', 'direction'],
      },
    },
    {
      name: 'place_trap',
      description: 'Place a trap at a grid position. Some traps include their own floor (spinningfloor, webspinner) - for those, no separate floor tile is needed.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          gridX: { type: 'number' },
          gridZ: { type: 'number' },
          trapType: {
            type: 'string',
            enum: ['flipgate', 'fourwingspinner', 'ghostspinner', 'lightningstrike', 'mine', 'oildrum', 'rock', 'spinningfloor', 'walkingturtle', 'webspinner'],
          },
          elevation: { type: 'number', default: 10.0 },
          orientation: { type: 'string', enum: ['H', 'V'], description: 'Only for flipgate: H=horizontal, V=vertical', default: 'H' },
        },
        required: ['gridX', 'gridZ', 'trapType'],
      },
    },
    {
      name: 'place_water',
      description: 'Place a water tile (uses Pirate theme water mesh regardless of map theme).',
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
      name: 'place_dropdown_tube',
      description: 'Place a dropdown tube for vertical transitions (e.g., between tower stories or for hidden passages).',
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
  ];
}

export function handleObjectPlacement(
  toolName: string,
  args: any,
  stateManager: MapStateManager,
  adapter: DomainAdapter
): ToolResult {
  const state = stateManager.getState();
  const holeNumber = state.currentHoleNumber;
  const elevation = args.elevation ?? DEFAULT_ELEVATION;

  switch (toolName) {
    case 'place_floor': {
      const obj = stateManager.addObject(adapter.createFloor(args.gridX, args.gridZ, elevation, holeNumber));
      return toolResult({ success: true, objectId: obj.id, worldPosition: { x: obj.pX, y: obj.pY, z: obj.pZ } });
    }

    case 'place_wall': {
      const side = args.side as Direction;
      const { x, z } = gridToWorld(args.gridX, args.gridZ);
      const halfGrid = GRID_SPACING / 2;

      let wallObj;
      if (side === 'north' || side === 'south') {
        const wallZ = side === 'north' ? z + halfGrid : z - halfGrid;
        const base = adapter.createWallH(args.gridX, args.gridZ, elevation, holeNumber);
        base.pZ = wallZ;
        wallObj = stateManager.addObject(base);
      } else {
        const wallX = side === 'east' ? x + halfGrid : x - halfGrid;
        const base = adapter.createWallV(args.gridX, args.gridZ, elevation, holeNumber);
        base.pX = wallX;
        wallObj = stateManager.addObject(base);
      }
      return toolResult({ success: true, objectId: wallObj.id, worldPosition: { x: wallObj.pX, y: wallObj.pY, z: wallObj.pZ } });
    }

    case 'place_ramp': {
      const dir = args.direction as Direction;
      const rampType = (args.type || 'ramp2') as RampType;
      const includeFoundation = args.includeFoundation !== false;
      const includeWalls = args.includeWalls === true;

      let objs;
      if (includeFoundation && rampType === 'ramp2') {
        objs = adapter.createRampWithFoundation(args.gridX, args.gridZ, elevation, dir, holeNumber, rampType, includeWalls);
      } else {
        objs = adapter.createRampWithFoundation(args.gridX, args.gridZ, elevation, dir, holeNumber, rampType, false);
      }

      const added = stateManager.addObjects(objs);
      return toolResult({
        success: true,
        objectIds: added.map((o) => o.id),
        objectCount: added.length,
        rampType,
        direction: dir,
      });
    }

    case 'place_trap': {
      const trapType = args.trapType as TrapType;
      const orientation = (args.orientation || 'H') as WallOrientation;
      const hasFloor = adapter.trapHasFloor(trapType);

      const trapObj = stateManager.addObject(adapter.createTrap(args.gridX, args.gridZ, elevation, trapType, holeNumber, orientation));
      return toolResult({
        success: true,
        objectId: trapObj.id,
        trapType,
        replacesFloor: hasFloor,
        note: hasFloor ? 'This trap includes its own floor - no need for a separate floor tile.' : 'Place a floor tile underneath this trap.',
      });
    }

    case 'place_water': {
      const obj = stateManager.addObject(adapter.createWater(args.gridX, args.gridZ, elevation, holeNumber));
      return toolResult({ success: true, objectId: obj.id, worldPosition: { x: obj.pX, y: obj.pY, z: obj.pZ } });
    }

    case 'place_dropdown_tube': {
      const obj = stateManager.addObject(adapter.createDropdownTube(args.gridX, args.gridZ, elevation, holeNumber));
      return toolResult({ success: true, objectId: obj.id, worldPosition: { x: obj.pX, y: obj.pY, z: obj.pZ } });
    }

    default:
      return toolError(`Unknown tool: ${toolName}`);
  }
}
