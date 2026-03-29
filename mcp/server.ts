import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { MapStateManager } from './state/map-state';
import { DomainAdapter } from './adapters/domain-adapter';
import { toolError } from './state/types';

import { getMapManagementTools, handleMapManagement } from './tools/map-management';
import { getObjectPlacementTools, handleObjectPlacement } from './tools/object-placement';
import { getHoleDesignTools, handleHoleDesign } from './tools/hole-design';
import { getValidationTools, handleValidation } from './tools/validation';
import { getProceduralGenerationTools, handleProceduralGeneration } from './tools/procedural-generation';
import { getLayoutHelperTools, handleLayoutHelpers } from './tools/layout-helpers';
import { getTerrainShapingTools, handleTerrainShaping } from './tools/terrain-shaping';
import { getEditingTools, handleEditing } from './tools/editing';
import { getCatalogPlacementTools, handleCatalogPlacement } from './tools/catalog-placement';
import { getResources, readResource } from './resources/catalog';

const stateManager = new MapStateManager();
const adapter = new DomainAdapter();

const server = new Server(
  {
    name: 'gwyf-map-builder',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

type ToolDef = { name: string; description: string; inputSchema: any };

/** Tool registry: single source of truth for tool categories, definitions, and handlers */
const TOOL_REGISTRY: Array<{
  category: string;
  getTools: () => ToolDef[];
  handle: (name: string, args: any) => any;
}> = [
  { category: 'map-management', getTools: getMapManagementTools, handle: (n, a) => handleMapManagement(n, a, stateManager, adapter) },
  { category: 'object-placement', getTools: getObjectPlacementTools, handle: (n, a) => handleObjectPlacement(n, a, stateManager, adapter) },
  { category: 'hole-design', getTools: getHoleDesignTools, handle: (n, a) => handleHoleDesign(n, a, stateManager, adapter) },
  { category: 'validation', getTools: getValidationTools, handle: (n, a) => handleValidation(n, a, stateManager) },
  { category: 'procedural-generation', getTools: getProceduralGenerationTools, handle: (n, a) => handleProceduralGeneration(n, a, stateManager, adapter) },
  { category: 'layout-helpers', getTools: getLayoutHelperTools, handle: (n, a) => handleLayoutHelpers(n, a, stateManager, adapter) },
  { category: 'terrain-shaping', getTools: getTerrainShapingTools, handle: (n, a) => handleTerrainShaping(n, a, stateManager, adapter) },
  { category: 'editing', getTools: getEditingTools, handle: (n, a) => handleEditing(n, a, stateManager) },
  { category: 'catalog-placement', getTools: getCatalogPlacementTools, handle: (n, a) => handleCatalogPlacement(n, a, stateManager, adapter) },
];

const allTools = TOOL_REGISTRY.flatMap(r => r.getTools());

/** Maps tool name to its registry entry for O(1) dispatch */
const TOOL_DISPATCH: Record<string, (typeof TOOL_REGISTRY)[number]> = {};
for (const entry of TOOL_REGISTRY) {
  for (const tool of entry.getTools()) {
    TOOL_DISPATCH[tool.name] = entry;
  }
}

/** Tools that can be called without an active map */
const NO_MAP_REQUIRED = new Set(['create_map', 'get_object_catalog', 'get_forest_catalog']);

// List Tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools,
}));

// Call Tool
server.setRequestHandler(CallToolRequestSchema, async (request): Promise<any> => {
  const { name, arguments: args } = request.params;
  const entry = TOOL_DISPATCH[name];

  if (!entry) {
    return toolError(`Unknown tool: ${name}`);
  }

  if (!stateManager.hasMap() && !NO_MAP_REQUIRED.has(name)) {
    return toolError('No map created yet. Call create_map first.');
  }

  try {
    return entry.handle(name, args || {});
  } catch (error: any) {
    return toolError(`Error: ${error.message}`);
  }
});

// List Resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: getResources(),
}));

// Read Resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  const content = readResource(uri, stateManager);
  return {
    contents: [
      {
        uri,
        mimeType: 'text/plain',
        text: content,
      },
    ],
  };
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
