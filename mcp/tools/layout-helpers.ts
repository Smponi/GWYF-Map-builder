import { MapStateManager } from '../state/map-state';
import { DomainAdapter } from '../adapters/domain-adapter';
import { toolResult, toolError, ToolResult, DEFAULT_ELEVATION, Direction, MapObject, gridToWorld, GRID_SPACING } from '../state/types';

export function getLayoutHelperTools() {
  return [
    {
      name: 'place_floor_rect',
      description: 'Place a rectangular area of floor tiles. Great for creating platforms, rooms, or fairways.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          startGridX: { type: 'number', description: 'Top-left grid X' },
          startGridZ: { type: 'number', description: 'Top-left grid Z' },
          width: { type: 'number', minimum: 1, description: 'Width in tiles' },
          height: { type: 'number', minimum: 1, description: 'Height in tiles' },
          elevation: { type: 'number', default: 10.0 },
        },
        required: ['startGridX', 'startGridZ', 'width', 'height'],
      },
    },
    {
      name: 'place_wall_line',
      description: 'Place a line of walls along one direction. Useful for borders and barriers.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          startGridX: { type: 'number' },
          startGridZ: { type: 'number' },
          direction: { type: 'string', enum: ['north', 'south', 'east', 'west'], description: 'Direction the wall line extends' },
          length: { type: 'number', minimum: 1, description: 'Number of wall segments' },
          side: { type: 'string', enum: ['north', 'south', 'east', 'west'], description: 'Which edge of each tile to place the wall on' },
          elevation: { type: 'number', default: 10.0 },
        },
        required: ['startGridX', 'startGridZ', 'direction', 'length', 'side'],
      },
    },
    {
      name: 'place_walls_around_rect',
      description: 'Place walls around the perimeter of a rectangular area. Supports openings for doorways.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          startGridX: { type: 'number' },
          startGridZ: { type: 'number' },
          width: { type: 'number', minimum: 1 },
          height: { type: 'number', minimum: 1 },
          elevation: { type: 'number', default: 10.0 },
          openings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                side: { type: 'string', enum: ['north', 'south', 'east', 'west'] },
                position: { type: 'number', description: 'Index along that side (0-based) where the opening is' },
              },
              required: ['side', 'position'],
            },
            description: 'List of wall gaps for doorways/entrances',
          },
        },
        required: ['startGridX', 'startGridZ', 'width', 'height'],
      },
    },
    {
      name: 'place_floor_path',
      description: 'Place floor tiles along a path defined by waypoints. Connects points with straight lines. Good for creating fairways and corridors.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          waypoints: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                gridX: { type: 'number' },
                gridZ: { type: 'number' },
              },
              required: ['gridX', 'gridZ'],
            },
            minItems: 2,
            description: 'Ordered list of grid positions to connect',
          },
          elevation: { type: 'number', default: 10.0 },
          width: { type: 'number', minimum: 1, maximum: 5, description: 'Path width in tiles (centered)', default: 1 },
        },
        required: ['waypoints'],
      },
    },
  ];
}

function bresenhamLine(x0: number, z0: number, x1: number, z1: number): Array<{ gridX: number; gridZ: number }> {
  const points: Array<{ gridX: number; gridZ: number }> = [];
  const dx = Math.abs(x1 - x0);
  const dz = Math.abs(z1 - z0);
  const sx = x0 < x1 ? 1 : -1;
  const sz = z0 < z1 ? 1 : -1;
  let err = dx - dz;

  let x = x0, z = z0;
  while (true) {
    points.push({ gridX: x, gridZ: z });
    if (x === x1 && z === z1) break;
    const e2 = 2 * err;
    if (e2 > -dz) { err -= dz; x += sx; }
    if (e2 < dx) { err += dx; z += sz; }
  }
  return points;
}

export function handleLayoutHelpers(
  toolName: string,
  args: any,
  stateManager: MapStateManager,
  adapter: DomainAdapter
): ToolResult {
  const state = stateManager.getState();
  const holeNumber = state.currentHoleNumber;
  const elevation = args.elevation ?? DEFAULT_ELEVATION;

  switch (toolName) {
    case 'place_floor_rect': {
      const objects: Omit<MapObject, 'id' | 'uid'>[] = [];
      for (let x = 0; x < args.width; x++) {
        for (let z = 0; z < args.height; z++) {
          objects.push(adapter.createFloor(args.startGridX + x, args.startGridZ + z, elevation, holeNumber));
        }
      }
      const added = stateManager.addObjects(objects);
      return toolResult({
        success: true,
        objectCount: added.length,
        bounds: {
          from: { gridX: args.startGridX, gridZ: args.startGridZ },
          to: { gridX: args.startGridX + args.width - 1, gridZ: args.startGridZ + args.height - 1 },
        },
      });
    }

    case 'place_wall_line': {
      const dir = args.direction as Direction;
      const side = args.side as Direction;
      const objects: Omit<MapObject, 'id' | 'uid'>[] = [];
      const halfGrid = GRID_SPACING / 2;

      for (let i = 0; i < args.length; i++) {
        let gx = args.startGridX;
        let gz = args.startGridZ;

        // Advance position along direction
        if (dir === 'east') gx += i;
        else if (dir === 'west') gx -= i;
        else if (dir === 'south') gz -= i;
        else if (dir === 'north') gz += i;

        const { x, z } = gridToWorld(gx, gz);

        if (side === 'north' || side === 'south') {
          const wallZ = side === 'north' ? z + halfGrid : z - halfGrid;
          const wall = adapter.createWallH(gx, gz, elevation, holeNumber);
          wall.pZ = wallZ;
          objects.push(wall);
        } else {
          const wallX = side === 'east' ? x + halfGrid : x - halfGrid;
          const wall = adapter.createWallV(gx, gz, elevation, holeNumber);
          wall.pX = wallX;
          objects.push(wall);
        }
      }

      const added = stateManager.addObjects(objects);
      return toolResult({ success: true, objectCount: added.length });
    }

    case 'place_walls_around_rect': {
      const objects: Omit<MapObject, 'id' | 'uid'>[] = [];
      const openings = new Set<string>();
      if (args.openings) {
        for (const o of args.openings) {
          openings.add(`${o.side}-${o.position}`);
        }
      }

      const halfGrid = GRID_SPACING / 2;
      const sx = args.startGridX;
      const sz = args.startGridZ;
      const w = args.width;
      const h = args.height;

      // North walls (top edge, z = sz + h - 1, wall on north side)
      for (let i = 0; i < w; i++) {
        if (openings.has(`north-${i}`)) continue;
        const { x, z } = gridToWorld(sx + i, sz + h - 1);
        const wall = adapter.createWallH(sx + i, sz + h - 1, elevation, holeNumber);
        wall.pZ = z + halfGrid;
        objects.push(wall);
      }

      // South walls (bottom edge, z = sz, wall on south side)
      for (let i = 0; i < w; i++) {
        if (openings.has(`south-${i}`)) continue;
        const { x, z } = gridToWorld(sx + i, sz);
        const wall = adapter.createWallH(sx + i, sz, elevation, holeNumber);
        wall.pZ = z - halfGrid;
        objects.push(wall);
      }

      // West walls (left edge, x = sx, wall on west side)
      for (let i = 0; i < h; i++) {
        if (openings.has(`west-${i}`)) continue;
        const { x, z } = gridToWorld(sx, sz + i);
        const wall = adapter.createWallV(sx, sz + i, elevation, holeNumber);
        wall.pX = x - halfGrid;
        objects.push(wall);
      }

      // East walls (right edge, x = sx + w - 1, wall on east side)
      for (let i = 0; i < h; i++) {
        if (openings.has(`east-${i}`)) continue;
        const { x, z } = gridToWorld(sx + w - 1, sz + i);
        const wall = adapter.createWallV(sx + w - 1, sz + i, elevation, holeNumber);
        wall.pX = x + halfGrid;
        objects.push(wall);
      }

      const added = stateManager.addObjects(objects);
      return toolResult({
        success: true,
        objectCount: added.length,
        openingCount: openings.size,
      });
    }

    case 'place_floor_path': {
      const waypoints: Array<{ gridX: number; gridZ: number }> = args.waypoints;
      const pathWidth = args.width ?? 1;
      const placed = new Set<string>();
      const objects: Omit<MapObject, 'id' | 'uid'>[] = [];

      for (let i = 0; i < waypoints.length - 1; i++) {
        const linePoints = bresenhamLine(waypoints[i].gridX, waypoints[i].gridZ, waypoints[i + 1].gridX, waypoints[i + 1].gridZ);

        for (const pt of linePoints) {
          // Expand width
          const halfW = Math.floor(pathWidth / 2);
          for (let dx = -halfW; dx <= halfW; dx++) {
            for (let dz = -halfW; dz <= halfW; dz++) {
              const gx = pt.gridX + dx;
              const gz = pt.gridZ + dz;
              const key = `${gx},${gz}`;
              if (!placed.has(key)) {
                placed.add(key);
                objects.push(adapter.createFloor(gx, gz, elevation, holeNumber));
              }
            }
          }
        }
      }

      const added = stateManager.addObjects(objects);
      return toolResult({
        success: true,
        objectCount: added.length,
        pathLength: placed.size,
      });
    }

    default:
      return toolError(`Unknown tool: ${toolName}`);
  }
}
