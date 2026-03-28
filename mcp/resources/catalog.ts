import { MapStateManager } from '../state/map-state';

export function getResources() {
  return [
    {
      uri: 'gwyf://catalog/objects',
      name: 'Object Catalog',
      description: 'Complete catalog of all placeable objects with their properties, obNames, and constraints.',
      mimeType: 'text/plain',
    },
    {
      uri: 'gwyf://catalog/themes',
      name: 'Theme Reference',
      description: 'Available themes and which objects support theme customization.',
      mimeType: 'text/plain',
    },
    {
      uri: 'gwyf://catalog/traps',
      name: 'Trap Reference',
      description: 'All trap types with properties: which include floors, special orientations, and effects.',
      mimeType: 'text/plain',
    },
    {
      uri: 'gwyf://constraints',
      name: 'Map Constraints',
      description: 'Grid system, coordinate bounds, elevation rules, and per-hole requirements.',
      mimeType: 'text/plain',
    },
    {
      uri: 'gwyf://guide/hidden-holes',
      name: 'Hidden Hole-in-One Guide',
      description: 'How to create hidden hole-in-one spots using dropdown tubes, secret passages, and elevation tricks.',
      mimeType: 'text/plain',
    },
    {
      uri: 'gwyf://guide/coordinate-system',
      name: 'Coordinate System Guide',
      description: 'Explanation of grid vs. world coordinates, elevation, and the Y/Z axis convention.',
      mimeType: 'text/plain',
    },
  ];
}

export function readResource(uri: string, stateManager: MapStateManager): string {
  switch (uri) {
    case 'gwyf://catalog/objects':
      return `# GWYF Object Catalog

## Terrain Tiles (6x6 units each)
- **floor**: Basic playable surface. obName: "6x6_Base_{theme}"
- **hole**: Hole cup (ball target). obName: "6x6HoleFlat_Base_{theme}"
- **water**: Water hazard. obName: "Pirate_Water" (always Pirate theme). Scale: 6x3x6.

## Walls (1x6 units, placed at tile edges)
- **wallH**: Horizontal wall. obName: "1x6_Wall_{theme}". Scale: 1x2x1.
- **wallV**: Vertical wall (90deg rotated). Same obName. Scale: 1x2x1.
- **foundationWallH**: Horizontal foundation. obName: "6x6Foundation_Wall_Forest" (hardcoded).
- **foundationWallV**: Vertical foundation. Same obName, rotated.

## Ramps (directional, 4 orientations: north/south/east/west)
- **ramp2**: Standard ramp, +2 elevation. obName: "6x6Ramp+2_Base_Forest" (hardcoded Forest).
  - Use with ramp2FoundationWall and ramp2Wall for complete ramp structure.
- **sramp2**: S-curve ramp. obName: "6x6_S-ramp_Forest" (hardcoded Forest).
- **largescurve3**: Large S-curve. obName: "Large_SCurve_Forest" (hardcoded Forest).
- **halframp**: Half ramp. obName: "Base_6x6_HalfRamp" (no theme).

## Game Objects
- **spawn**: Player spawn point. obName: "SingleSpawn". sType: 4. One per hole required.
- **flagpole**: Goal marker. obName: "FlagPole_{theme}". One per hole required. Y offset: -1.0.
- **dropdownTube**: Vertical tube for falling. obName: "6x6_DropdownTube_{theme}".

## Traps (see gwyf://catalog/traps for details)
10 trap types available. Some include built-in floors (spinningfloor, webspinner).`;

    case 'gwyf://catalog/themes':
      return `# GWYF Themes

## Available Themes
1. **Forest** (default) - Woodland theme
2. **Oasis** - Desert/tropical theme
3. **Space** - Space/sci-fi theme
4. **Pirate** - Pirate/nautical theme
5. **Haunted** - Spooky/horror theme
6. **Candy** - Candy/sweet theme

## Theme Support by Object
Objects that USE the theme (appearance changes with theme setting):
- Floor: "6x6_Base_{theme}"
- Hole cup: "6x6HoleFlat_Base_{theme}"
- Walls (H/V): "1x6_Wall_{theme}"
- Flagpole: "FlagPole_{theme}"
- Dropdown Tube: "6x6_DropdownTube_{theme}"

Objects with HARDCODED themes (appearance does NOT change):
- Ramp2: Always "6x6Ramp+2_Base_Forest"
- Ramp2 Foundation: Always "6x6+2Foundation_Wall_Forest"
- Ramp2 Wall: Always "1x6Ramp+2_Wall_Forest"
- SRamp2: Always "6x6_S-ramp_Forest"
- SRamp2 Foundation: Always "Wall_Foundation 6x6_smooth+2"
- LargeSCurve3: Always "Large_SCurve_Forest"
- Foundation Walls: Always "6x6Foundation_Wall_Forest"
- Water: Always "Pirate_Water"
- HalfRamp: Always "Base_6x6_HalfRamp"

**Recommendation**: For most consistent visuals, use the Forest theme.`;

    case 'gwyf://catalog/traps':
      return `# GWYF Traps Reference

| Trap | obName | Has Floor | Y Offset | Orientation | Notes |
|------|--------|-----------|----------|-------------|-------|
| flipgate | FlipGate | No | 0 | H or V | Only trap with orientation param |
| fourwingspinner | Fourwingspinner | No | 0 | - | Four spinning arms |
| ghostspinner | GhostSpinner | No | +3 | - | Floats above, photonViewID: [7] |
| lightningstrike | Lightningstrike | No | 0 | - | Periodic lightning |
| mine | Mine | No | 0 | - | Explodes on contact, photonViewID: [3,5] |
| oildrum | OilDrum | No | 0 | - | Explosive barrel, photonViewID: [4,6] |
| rock | FRock01 | No | 0 | - | Static obstacle |
| spinningfloor | F_Spinner6x6 | YES | 0 | - | Rotating platform, includes floor |
| walkingturtle | WalkingTurtle | No | 0 | - | Moving obstacle |
| webspinner | H_WebSpinner | YES | 0 | - | Web effect, includes floor |

**Has Floor** = These traps replace the floor tile. Do NOT place a separate floor underneath them.
**No Floor** = These traps sit ON TOP of a floor tile. Place a floor first, then the trap.
**photonViewID** = Required for multiplayer networking. Automatically set by the adapter.`;

    case 'gwyf://constraints':
      return `# GWYF Map Constraints

## Coordinate System
- **Grid coordinates**: Integer positions. Each grid unit = 6 world units.
- **World coordinates**: Actual positions in-game. X and Z are horizontal, Y is vertical (elevation).
- Grid (0,0) = World origin (0, elevation, 0).
- Grid (-40,-40) to (40,40) covers most of the playable area.

## Map Bounds
- X axis: -245 to 245 (world units)
- Z axis: -245 to 245 (world units)
- Y axis: No hard limit, but typical range is 4-50

## Grid Spacing
- Each tile occupies 6x6 world units
- Walls are placed at tile edges: offset by 3 units (half a tile)
- Maximum usable grid range: approximately -40 to 40 in each direction

## Per-Hole Requirements
- Exactly 1 Spawn point per hole
- Exactly 1 Hole cup (target) per hole
- Exactly 1 Flagpole per hole (at the same position as the hole cup)
- Maximum 18 holes per map

## Elevation
- Default elevation: 10.0
- Minimum practical elevation: 4 (used for water/ground level)
- Ramp2 changes elevation by 2 units
- Steepness in terrain generation: 0-5 (max elevation change between adjacent tiles)

## Object Count
- No hard limit documented, but performance degrades with very large maps
- Recommended: stay under 5000 objects for smooth gameplay`;

    case 'gwyf://guide/hidden-holes':
      return `# Hidden Hole-in-One Guide

Hidden hole-in-ones are secret alternative goals that players can discover. They make maps more interesting and reward exploration.

## Techniques

### 1. Dropdown Tube Secret
Place a dropdown tube at an unexpected location (e.g., behind a wall gap or at the edge of the course).
Below the tube, at a lower elevation, place a small room with a hole cup marked as hidden.

\`\`\`
1. Create main course at elevation 10
2. Place a dropdown tube at a strategic location
3. Create a small room at elevation 4 (below main course)
4. Place hole cup + flagpole in the secret room
\`\`\`

### 2. Elevated Platform Secret
Create a raised platform accessible only via a specific ramp.
Place the hidden hole cup on the platform.

### 3. Behind-the-Wall Secret
Leave a small gap in a wall (use openings in place_walls_around_rect).
Behind the wall, place a floor tile with the hidden hole cup.
The gap should be subtle enough that players might miss it.

### 4. Water Island Secret
In terrain maps with water, create a small island surrounded by water.
Place the hidden hole cup on the island. Players must carefully navigate to it.

## Implementation
Use \`create_complete_hole\` with the \`hiddenHolePosition\` parameter to automatically set up both the main hole and the secret one.
Or manually place a hole cup with \`place_hole_cup\` and set \`hidden: true\`.`;

    case 'gwyf://guide/coordinate-system':
      return `# Coordinate System Guide

## Grid Coordinates (what you use in tools)
- Integer positions
- Grid (0, 0) is the center of the map
- Grid X increases to the east (right)
- Grid Z increases to the north (up)
- Each grid unit = 6 world units

## World Coordinates (internal game coordinates)
- worldX = gridX * 6
- worldZ = gridZ * 6
- worldY = elevation (height above ground)

## Elevation (Y axis)
- Default: 10.0
- Water/ground level: ~4
- Ramps change elevation by 2 per ramp
- The elevation parameter in tools sets worldY directly

## Wall Placement
- Walls are placed at tile EDGES, offset by 3 units from tile center
- "north" side: wall at gridZ + 0.5 (world Z + 3)
- "south" side: wall at gridZ - 0.5 (world Z - 3)
- "east" side: wall at gridX + 0.5 (world X + 3)
- "west" side: wall at gridX - 0.5 (world X - 3)

## Important Y/Z Note
The original codebase swaps Y and Z internally:
- Constructor parameter "y" → stored as pZ (depth on grid)
- Constructor parameter "z" → stored as pY (elevation)
The MCP adapter handles this transparently. You never need to worry about this.

## Example: 5x5 platform at grid (0,0)
- Grid positions: (0,0) to (4,4)
- World X range: 0 to 24
- World Z range: 0 to 24
- Use place_floor_rect with startGridX=0, startGridZ=0, width=5, height=5`;

    default:
      return `Unknown resource: ${uri}`;
  }
}
