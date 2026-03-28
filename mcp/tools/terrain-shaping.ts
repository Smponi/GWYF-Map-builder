import { MapStateManager } from '../state/map-state';
import { DomainAdapter } from '../adapters/domain-adapter';
import { toolResult, toolError, ToolResult, DEFAULT_ELEVATION, Direction, MapObject, RampType } from '../state/types';

export function getTerrainShapingTools() {
  return [
    {
      name: 'create_ramp_connection',
      description: 'Create a ramp connecting two adjacent tiles at different elevations. Automatically determines direction and places foundation walls.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          fromGridX: { type: 'number', description: 'Grid X of the LOWER tile' },
          fromGridZ: { type: 'number', description: 'Grid Z of the LOWER tile' },
          fromElevation: { type: 'number', description: 'Elevation of the lower tile' },
          toGridX: { type: 'number', description: 'Grid X of the HIGHER tile (must be adjacent)' },
          toGridZ: { type: 'number', description: 'Grid Z of the HIGHER tile (must be adjacent)' },
          toElevation: { type: 'number', description: 'Elevation of the higher tile' },
          rampType: { type: 'string', enum: ['ramp2', 'sramp2', 'largescurve3', 'halframp'], default: 'ramp2' },
        },
        required: ['fromGridX', 'fromGridZ', 'fromElevation', 'toGridX', 'toGridZ', 'toElevation'],
      },
    },
    {
      name: 'create_bridge',
      description: 'Create a bridge: a raised platform of floor tiles connecting two points, with optional ramps at each end and side walls.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          startGridX: { type: 'number' },
          startGridZ: { type: 'number' },
          endGridX: { type: 'number' },
          endGridZ: { type: 'number' },
          elevation: { type: 'number', description: 'Bridge deck elevation' },
          groundElevation: { type: 'number', description: 'Ground level below the bridge', default: 10.0 },
          includeRamps: { type: 'boolean', description: 'Add ramps at each end', default: true },
          includeWalls: { type: 'boolean', description: 'Add side walls along the bridge', default: true },
        },
        required: ['startGridX', 'startGridZ', 'endGridX', 'endGridZ', 'elevation'],
      },
    },
  ];
}

export function handleTerrainShaping(
  toolName: string,
  args: any,
  stateManager: MapStateManager,
  adapter: DomainAdapter
): ToolResult {
  const state = stateManager.getState();
  const holeNumber = state.currentHoleNumber;

  switch (toolName) {
    case 'create_ramp_connection': {
      const dx = args.toGridX - args.fromGridX;
      const dz = args.toGridZ - args.fromGridZ;

      // Must be adjacent
      if (Math.abs(dx) + Math.abs(dz) !== 1) {
        return toolError('Tiles must be adjacent (exactly 1 step apart in X or Z).');
      }

      // Determine direction: ramp ascends from lower toward higher
      let direction: Direction;
      if (dx === 1) direction = 'east';
      else if (dx === -1) direction = 'west';
      else if (dz === 1) direction = 'north';
      else direction = 'south';

      const rampType = (args.rampType || 'ramp2') as RampType;
      const objects = adapter.createRampWithFoundation(
        args.fromGridX,
        args.fromGridZ,
        args.fromElevation,
        direction,
        holeNumber,
        rampType,
        false
      );

      const added = stateManager.addObjects(objects);
      return toolResult({
        success: true,
        objectCount: added.length,
        direction,
        elevationChange: args.toElevation - args.fromElevation,
      });
    }

    case 'create_bridge': {
      const objects: Omit<MapObject, 'id'>[] = [];
      const bridgeElev = args.elevation;
      const groundElev = args.groundElevation ?? DEFAULT_ELEVATION;

      // Determine if bridge is horizontal (along X) or vertical (along Z)
      const dx = args.endGridX - args.startGridX;
      const dz = args.endGridZ - args.startGridZ;

      if (dx !== 0 && dz !== 0) {
        return toolError('Bridge must be axis-aligned (either startGridX == endGridX or startGridZ == endGridZ).');
      }

      const isHorizontal = dx !== 0;
      const length = isHorizontal ? Math.abs(dx) + 1 : Math.abs(dz) + 1;
      const step = isHorizontal ? (dx > 0 ? 1 : -1) : (dz > 0 ? 1 : -1);

      // Place bridge deck
      for (let i = 0; i < length; i++) {
        const gx = isHorizontal ? args.startGridX + i * step : args.startGridX;
        const gz = isHorizontal ? args.startGridZ : args.startGridZ + i * step;
        objects.push(adapter.createFloor(gx, gz, bridgeElev, holeNumber));

        // Side walls
        if (args.includeWalls !== false) {
          if (isHorizontal) {
            // Walls on north and south sides
            objects.push(adapter.createWallOnSide(gx, gz, 'north', bridgeElev, holeNumber));
            objects.push(adapter.createWallOnSide(gx, gz, 'south', bridgeElev, holeNumber));
          } else {
            // Walls on east and west sides
            objects.push(adapter.createWallOnSide(gx, gz, 'east', bridgeElev, holeNumber));
            objects.push(adapter.createWallOnSide(gx, gz, 'west', bridgeElev, holeNumber));
          }
        }
      }

      // Ramps at each end
      if (args.includeRamps !== false) {
        if (isHorizontal) {
          const startDir: Direction = dx > 0 ? 'east' : 'west';
          const endDir: Direction = dx > 0 ? 'west' : 'east';
          // Ramp before bridge start
          objects.push(...adapter.createRampWithFoundation(
            args.startGridX - step, args.startGridZ, groundElev, startDir, holeNumber, 'ramp2', false
          ));
          // Ramp after bridge end
          objects.push(...adapter.createRampWithFoundation(
            args.endGridX + step, args.endGridZ, groundElev, endDir, holeNumber, 'ramp2', false
          ));
        } else {
          const startDir: Direction = dz > 0 ? 'north' : 'south';
          const endDir: Direction = dz > 0 ? 'south' : 'north';
          objects.push(...adapter.createRampWithFoundation(
            args.startGridX, args.startGridZ - step, groundElev, startDir, holeNumber, 'ramp2', false
          ));
          objects.push(...adapter.createRampWithFoundation(
            args.endGridX, args.endGridZ + step, groundElev, endDir, holeNumber, 'ramp2', false
          ));
        }
      }

      const added = stateManager.addObjects(objects);
      return toolResult({
        success: true,
        objectCount: added.length,
        bridgeLength: length,
        direction: isHorizontal ? 'horizontal' : 'vertical',
      });
    }

    default:
      return toolError(`Unknown tool: ${toolName}`);
  }
}
