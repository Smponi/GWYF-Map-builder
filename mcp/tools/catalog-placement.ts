import { MapStateManager } from '../state/map-state';
import { DomainAdapter } from '../adapters/domain-adapter';
import { toolResult, toolError, ToolResult } from '../state/types';
import {
  FOREST_ITEM_CATALOG,
  getItemsByCategory,
  getCategories,
  findItem,
  ItemCategory,
} from '../catalog/forest-items';

/** Quaternion presets for common rotations (Y-axis) */
const ROTATION_PRESETS: Record<string, { rW: number; rX: number; rY: number; rZ: number }> = {
  '0':   { rW: 1.0,    rX: 0, rY: 0.0,    rZ: 0 },
  '90':  { rW: 0.7071, rX: 0, rY: 0.7071, rZ: 0 },
  '180': { rW: 0.0,    rX: 0, rY: 1.0,    rZ: 0 },
  '270': { rW: -0.7071, rX: 0, rY: 0.7071, rZ: 0 },
};

export function getCatalogPlacementTools() {
  return [
    {
      name: 'place_catalog_item',
      description:
        'Place ANY item from the complete catalog by its obName. Use get_forest_catalog to browse available items. Handles theme suffixes, default scales, and y-offsets automatically.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          obName: {
            type: 'string',
            description: 'The exact obName from the catalog (e.g. "6x6_Tunnel_Forest", "BigRedPine01", "Pirate_Water")',
          },
          gridX: { type: 'number', description: 'Grid X coordinate (integer)' },
          gridZ: { type: 'number', description: 'Grid Z coordinate (integer)' },
          elevation: { type: 'number', description: 'World Y elevation', default: 10.0 },
          rotationDegrees: {
            type: 'number',
            enum: [0, 90, 180, 270],
            description: 'Y-axis rotation in degrees (0, 90, 180, 270)',
            default: 0,
          },
          customRotation: {
            type: 'object',
            description: 'Custom quaternion rotation (overrides rotationDegrees)',
            properties: {
              rW: { type: 'number' },
              rX: { type: 'number' },
              rY: { type: 'number' },
              rZ: { type: 'number' },
            },
          },
          scale: {
            type: 'object',
            description: 'Custom scale (overrides catalog default)',
            properties: {
              sX: { type: 'number' },
              sY: { type: 'number' },
              sZ: { type: 'number' },
            },
          },
        },
        required: ['obName', 'gridX', 'gridZ'],
      },
    },
    {
      name: 'place_scenery',
      description:
        'Place a decorative scenery item around the map. These are non-gameplay items like trees, buildings, rocks, etc. Use worldX/worldZ for precise positioning (not grid-snapped).',
      inputSchema: {
        type: 'object' as const,
        properties: {
          obName: {
            type: 'string',
            description: 'Scenery obName (e.g. "BigRedPine01", "Castle_Building01", "Forest_Well")',
          },
          worldX: { type: 'number', description: 'World X position (free positioning, not grid-snapped)' },
          worldZ: { type: 'number', description: 'World Z position (free positioning, not grid-snapped)' },
          elevation: { type: 'number', default: 10.0 },
          rotationDegrees: { type: 'number', enum: [0, 90, 180, 270], default: 0 },
          scale: {
            type: 'object',
            description: 'Custom scale',
            properties: { sX: { type: 'number' }, sY: { type: 'number' }, sZ: { type: 'number' } },
          },
        },
        required: ['obName', 'worldX', 'worldZ'],
      },
    },
    {
      name: 'get_forest_catalog',
      description:
        'Browse the complete Forest item catalog. Filter by category to see available items. Categories: floor, hole, ramp, wall, foundation, tunnel, trench, tube, halfpipe, logflume, special_floor, trap, mechanical, water, scenery, sign, boost, flag, sports, camera.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          category: {
            type: 'string',
            description: 'Filter by category (optional). Omit to see all categories with counts.',
            enum: [
              'floor', 'hole', 'ramp', 'wall', 'foundation', 'tunnel', 'trench',
              'tube', 'halfpipe', 'logflume', 'special_floor', 'trap', 'mechanical',
              'water', 'scenery', 'sign', 'boost', 'flag', 'sports', 'camera',
            ],
          },
        },
      },
    },
  ];
}

export function handleCatalogPlacement(
  toolName: string,
  args: any,
  stateManager: MapStateManager,
  adapter: DomainAdapter
): ToolResult {
  const state = stateManager.getState();
  const holeNumber = state.currentHoleNumber;
  const elevation = args.elevation ?? 10.0;

  switch (toolName) {
    case 'place_catalog_item': {
      const { obName, gridX, gridZ } = args;

      const catalogItem = findItem(obName);
      if (!catalogItem) {
        return toolError(`Unknown item "${obName}". Use get_forest_catalog to browse available items.`);
      }

      const rotation = args.customRotation ??
        ROTATION_PRESETS[String(args.rotationDegrees ?? 0)] ??
        ROTATION_PRESETS['0'];

      const obj = stateManager.addObject(
        adapter.createCatalogItem(obName, gridX, gridZ, elevation, holeNumber, {
          rotation,
          scale: args.scale,
        })
      );

      return toolResult({
        success: true,
        objectId: obj.id,
        obName: obj.obName,
        category: catalogItem.category,
        worldPosition: { x: obj.pX, y: obj.pY, z: obj.pZ },
        hasFloor: catalogItem.hasFloor ?? false,
        isScenery: catalogItem.isScenery ?? false,
        note: catalogItem.hasFloor
          ? 'This item includes its own floor - no separate floor tile needed.'
          : catalogItem.isScenery
          ? 'Decorative item - no gameplay effect.'
          : undefined,
      });
    }

    case 'place_scenery': {
      const { obName, worldX, worldZ } = args;
      const catalogItem = findItem(obName);
      if (!catalogItem) {
        return toolError(`Unknown scenery item "${obName}". Use get_forest_catalog with category "scenery" to browse.`);
      }

      const baseObj = adapter.createCatalogItem(obName, 0, 0, elevation, holeNumber, {
        rotation: ROTATION_PRESETS[String(args.rotationDegrees ?? 0)] ?? ROTATION_PRESETS['0'],
        scale: args.scale,
      });
      // Override with world coordinates (scenery uses free positioning, not grid-snapped)
      baseObj.pX = worldX;
      baseObj.pZ = worldZ;
      delete baseObj.gridX;
      delete baseObj.gridZ;

      const obj = stateManager.addObject(baseObj);

      return toolResult({
        success: true,
        objectId: obj.id,
        obName: obj.obName,
        category: catalogItem.category,
        worldPosition: { x: obj.pX, y: obj.pY, z: obj.pZ },
      });
    }

    case 'get_forest_catalog': {
      if (args.category) {
        const category = args.category as ItemCategory;
        const items = getItemsByCategory(category);
        if (items.length === 0) {
          return toolError(`No items found for category "${category}".`);
        }
        return toolResult({
          category,
          itemCount: items.length,
          items: items.map((item) => ({
            obName: item.obName,
            description: item.description,
            themed: item.themed,
            hasFloor: item.hasFloor ?? false,
            isScenery: item.isScenery ?? false,
            supportsRotation: item.supportsRotation ?? false,
            defaultScale: item.defaultScale,
            yOffset: item.yOffset,
          })),
        });
      }

      // Show category overview
      const categories = getCategories();
      const overview = categories.map((cat) => ({
        category: cat,
        count: getItemsByCategory(cat).length,
        examples: getItemsByCategory(cat)
          .slice(0, 3)
          .map((i) => i.obName),
      }));

      return toolResult({
        totalItems: FOREST_ITEM_CATALOG.length,
        categories: overview,
        usage: 'Call get_forest_catalog with a specific category to see all items in that category.',
      });
    }

    default:
      return toolError(`Unknown tool: ${toolName}`);
  }
}
