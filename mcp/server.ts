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

// Tool name -> handler category mapping
const TOOL_HANDLERS: Record<string, string> = {};

function registerTools(tools: Array<{ name: string }>, category: string) {
  for (const tool of tools) {
    TOOL_HANDLERS[tool.name] = category;
  }
}

const allTools = [
  ...getMapManagementTools(),
  ...getObjectPlacementTools(),
  ...getHoleDesignTools(),
  ...getValidationTools(),
  ...getProceduralGenerationTools(),
  ...getLayoutHelperTools(),
  ...getTerrainShapingTools(),
  ...getEditingTools(),
];

registerTools(getMapManagementTools(), 'map-management');
registerTools(getObjectPlacementTools(), 'object-placement');
registerTools(getHoleDesignTools(), 'hole-design');
registerTools(getValidationTools(), 'validation');
registerTools(getProceduralGenerationTools(), 'procedural-generation');
registerTools(getLayoutHelperTools(), 'layout-helpers');
registerTools(getTerrainShapingTools(), 'terrain-shaping');
registerTools(getEditingTools(), 'editing');

// List Tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools,
}));

// Call Tool
server.setRequestHandler(CallToolRequestSchema, async (request): Promise<any> => {
  const { name, arguments: args } = request.params;
  const category = TOOL_HANDLERS[name];

  if (!category) {
    return toolError(`Unknown tool: ${name}`);
  }

  // All tools except create_map and get_object_catalog require an active map
  if (!stateManager.hasMap() && name !== 'create_map' && name !== 'get_object_catalog') {
    return toolError('No map created yet. Call create_map first.');
  }

  try {
    switch (category) {
      case 'map-management':
        return handleMapManagement(name, args || {}, stateManager, adapter);
      case 'object-placement':
        return handleObjectPlacement(name, args || {}, stateManager, adapter);
      case 'hole-design':
        return handleHoleDesign(name, args || {}, stateManager, adapter);
      case 'validation':
        return handleValidation(name, args || {}, stateManager);
      case 'procedural-generation':
        return handleProceduralGeneration(name, args || {}, stateManager, adapter);
      case 'layout-helpers':
        return handleLayoutHelpers(name, args || {}, stateManager, adapter);
      case 'terrain-shaping':
        return handleTerrainShaping(name, args || {}, stateManager, adapter);
      case 'editing':
        return handleEditing(name, args || {}, stateManager);
      default:
        return toolError(`Unknown category: ${category}`);
    }
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
