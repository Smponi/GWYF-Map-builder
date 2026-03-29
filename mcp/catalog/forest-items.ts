/**
 * Complete catalog of ALL Forest theme items for GWYF.
 * Extracted from the game's level editor.
 *
 * Categories:
 * - floor: Playable ground tiles (6x6)
 * - hole: Goal tiles with various indent sizes
 * - ramp: Elevation change tiles
 * - wall: Border/barrier pieces
 * - foundation: Support structures under ramps/elevated tiles
 * - tunnel: Enclosed passage pieces
 * - trench: Open channel pieces
 * - tube: Vertical/enclosed connectors
 * - halfpipe: Half-pipe shaped tiles
 * - logflume: Log flume water ride pieces
 * - special_floor: Unique playable surfaces (bumps, slides, balance, etc.)
 * - trap: Active hazards and obstacles
 * - mechanical: Moving/interactive structures (lifts, spinners, windmills)
 * - water: Various water/liquid hazard types
 * - scenery: Decorative non-gameplay items (trees, buildings, rocks, etc.)
 * - sign: Hole number signs and markers
 * - boost: Speed boost pads
 * - flag: Flagpoles and goal markers
 * - sports: Hockey/hoop game mode objects
 * - camera: Editor camera objects
 * - misc: Uncategorized items
 */

export type ItemCategory =
  | 'floor'
  | 'hole'
  | 'ramp'
  | 'wall'
  | 'foundation'
  | 'tunnel'
  | 'trench'
  | 'tube'
  | 'halfpipe'
  | 'logflume'
  | 'special_floor'
  | 'trap'
  | 'mechanical'
  | 'water'
  | 'scenery'
  | 'sign'
  | 'boost'
  | 'flag'
  | 'sports'
  | 'camera'
  | 'misc';

export interface CatalogItem {
  obName: string;
  category: ItemCategory;
  description: string;
  /** Whether this object uses the theme suffix (e.g. _Forest, _CandyLand) */
  themed: boolean;
  /** Default scale if different from 1,1,1 */
  defaultScale?: { sX: number; sY: number; sZ: number };
  /** Y offset from placement elevation */
  yOffset?: number;
  /** sType value (0 for most, 4 for spawn, 5 for camera) */
  sType?: number;
  /** photonViewID for multiplayer sync */
  photonViewID?: number[];
  /** Whether this item includes its own floor (no need for separate floor tile) */
  hasFloor?: boolean;
  /** Whether this item is purely decorative (no gameplay effect) */
  isScenery?: boolean;
  /** Whether this object supports rotation */
  supportsRotation?: boolean;
}

// ============================================================
// FLOOR TILES
// ============================================================
const FLOOR_ITEMS: CatalogItem[] = [
  { obName: '6x6_Base_Forest', category: 'floor', description: 'Standard 6x6 floor tile', themed: true },
  { obName: '6x6_Corner_Forest', category: 'floor', description: 'Corner floor tile', themed: true, supportsRotation: true },
  { obName: '6x6CurvedCorner_Base_Forest', category: 'floor', description: 'Curved corner floor tile', themed: true, supportsRotation: true },
  { obName: 'Base_6x6_SpeedBumps_Forest', category: 'floor', description: 'Floor with speed bumps', themed: true },
  { obName: 'Base_6x6_Splitbumps', category: 'floor', description: 'Floor with split bumps', themed: false },
  { obName: 'Base_6x6_Smooth+1', category: 'floor', description: 'Smooth elevated floor (+1)', themed: false },
  { obName: 'Base_1x1_Dark_Forest', category: 'floor', description: 'Small 1x1 dark floor tile', themed: true },
  { obName: 'Base_1x1_Light_Forest', category: 'floor', description: 'Small 1x1 light floor tile', themed: true },
  { obName: 'Base_1x1_White', category: 'floor', description: 'Small 1x1 white floor tile', themed: false },
  { obName: 'Base_1x1_Black', category: 'floor', description: 'Small 1x1 black floor tile', themed: false },
  { obName: 'Base_1x1_Glass', category: 'floor', description: 'Small 1x1 glass floor tile (transparent)', themed: false },
  { obName: 'Parallel_6x6_Forest', category: 'floor', description: 'Parallel lane floor tile', themed: true },
];

// ============================================================
// HOLE TILES (goal targets)
// ============================================================
const HOLE_ITEMS: CatalogItem[] = [
  { obName: '6x6HoleFlat_Base_Forest', category: 'hole', description: 'Standard flat hole tile', themed: true },
  { obName: '6x6HoleIndent_Base_Forest', category: 'hole', description: 'Hole with medium indent', themed: true },
  { obName: '6x6HoleLargeIndent_Base_Forest', category: 'hole', description: 'Hole with large indent', themed: true },
  { obName: '6x6HoleSmallIndent_Base_Forest', category: 'hole', description: 'Hole with small indent', themed: true },
  { obName: '2x2HoleFlat_Base_Forest', category: 'hole', description: 'Small 2x2 flat hole tile', themed: true },
  { obName: 'Invisible_Hole', category: 'hole', description: 'Invisible hole (hidden goal)', themed: false },
  { obName: 'Invisible_Hole_Sphere', category: 'hole', description: 'Invisible spherical hole trigger', themed: false },
  { obName: 'Invisible_Hole_Disk', category: 'hole', description: 'Invisible disk-shaped hole trigger', themed: false },
];

// ============================================================
// RAMP TILES
// ============================================================
const RAMP_ITEMS: CatalogItem[] = [
  { obName: '6x6Ramp+1_Base_Forest', category: 'ramp', description: 'Ramp with +1 height change', themed: true, supportsRotation: true },
  { obName: '6x6Ramp+2_Base_Forest', category: 'ramp', description: 'Ramp with +2 height change', themed: true, supportsRotation: true },
  { obName: '6x6SmoothRamp+2_Base_Forest', category: 'ramp', description: 'Smooth ramp with +2 height change', themed: true, supportsRotation: true },
  { obName: '6x6_S-ramp_Forest', category: 'ramp', description: 'S-shaped ramp', themed: true, supportsRotation: true },
  { obName: 'S-Ramp_Corner_Forest', category: 'ramp', description: 'S-ramp corner piece', themed: true, supportsRotation: true },
  { obName: 'Large_SCurve_Forest', category: 'ramp', description: 'Large S-curve ramp', themed: true, supportsRotation: true },
  { obName: '6x6Hump+1_Base_Forest', category: 'ramp', description: 'Small hump (+1 height)', themed: true, supportsRotation: true },
  { obName: '6x6Hump+2_Base_Forest', category: 'ramp', description: 'Large hump (+2 height)', themed: true, supportsRotation: true },
  { obName: 'Slightcurve_180bend_Forest', category: 'ramp', description: '180-degree curved bend', themed: true, supportsRotation: true },
  { obName: 'C-Ramp_Forest', category: 'ramp', description: 'C-shaped ramp', themed: true, supportsRotation: true },
  { obName: 'Horizonatl_SCurve', category: 'ramp', description: 'Horizontal S-curve (note: typo is in game)', themed: false, supportsRotation: true },
  { obName: 'Longramp_forest', category: 'ramp', description: 'Extended length ramp', themed: false, supportsRotation: true },
];

// ============================================================
// WALL PIECES
// ============================================================
const WALL_ITEMS: CatalogItem[] = [
  { obName: '1x6_Wall_Forest', category: 'wall', description: 'Standard 1x6 wall', themed: true, defaultScale: { sX: 1, sY: 2, sZ: 1 } },
  { obName: '1x6Bump+1_Wall_Forest', category: 'wall', description: 'Wall with +1 bump', themed: true },
  { obName: '1x6Ramp+1_Wall_Forest', category: 'wall', description: 'Wall following +1 ramp slope', themed: true },
  { obName: '1x6Ramp+2_Wall_Forest', category: 'wall', description: 'Wall following +2 ramp slope', themed: true },
  { obName: '1x6SmoothRamp+1_Wall_Forest', category: 'wall', description: 'Smooth wall following +1 ramp', themed: true },
  { obName: 'Wall_1x6_Curved_Forest', category: 'wall', description: 'Curved wall segment', themed: true },
  { obName: 'Wall_1x6_Smooth+2_Forest', category: 'wall', description: 'Smooth wall +2 height', themed: true },
  { obName: 'Wall_6x6_HalfRamp', category: 'wall', description: 'Wall for half-ramp tile', themed: false },
  { obName: 'Wall_Foundation 6x6_HalfRamp', category: 'wall', description: 'Foundation wall for half-ramp', themed: false },
  { obName: 'Wall_Foundation 6x6_smooth+2', category: 'wall', description: 'Foundation wall for smooth +2', themed: false },
  { obName: 'Parallel_1x6_Wall', category: 'wall', description: 'Parallel lane wall divider', themed: false },
  { obName: 'WallCornerLog_Wall_Forest', category: 'wall', description: 'Log corner wall piece', themed: true },
  { obName: 'WallEndLog_Wall_Forest', category: 'wall', description: 'Log wall end piece', themed: true },
  { obName: 'Divider_Forest', category: 'wall', description: 'Floor divider/barrier', themed: true },
  { obName: 'F_HalfCircle', category: 'wall', description: 'Half-circle wall/barrier', themed: false },
  { obName: 'Large_SCurve_Wall_Forest', category: 'wall', description: 'Wall for large S-curve ramp', themed: true },
  { obName: 'Misc_Corner_2x2', category: 'wall', description: 'Small 2x2 corner piece', themed: false },
];

// ============================================================
// FOUNDATION PIECES
// ============================================================
const FOUNDATION_ITEMS: CatalogItem[] = [
  { obName: '6x6Foundation_Wall_Forest', category: 'foundation', description: 'Standard 6x6 foundation wall', themed: true },
  { obName: '6x3Foundation_Wall_Forest', category: 'foundation', description: '6x3 foundation wall (half width)', themed: true },
  { obName: '6x6+1Foundation_Wall_Forest', category: 'foundation', description: 'Foundation wall for +1 elevation', themed: true },
  { obName: '6x6+2Foundation_Wall_Forest', category: 'foundation', description: 'Foundation wall for +2 elevation', themed: true },
  { obName: '6x6Bump+1Foundation_Wall_Forest', category: 'foundation', description: 'Foundation wall for +1 bump', themed: true },
  { obName: 'Foundation_6x6_Smooth+1', category: 'foundation', description: 'Smooth foundation +1', themed: false },
  { obName: 'Base_6x6_Curved_DipFoundation', category: 'foundation', description: 'Curved dip foundation', themed: false },
  { obName: 'BASEcorner_Forest', category: 'foundation', description: 'Base corner foundation piece', themed: true },
  { obName: 'Large_SCurve_Forest_Foundation', category: 'foundation', description: 'Foundation for large S-curve', themed: true },
];

// ============================================================
// TUNNEL PIECES
// ============================================================
const TUNNEL_ITEMS: CatalogItem[] = [
  { obName: '6x6_Tunnel_Forest', category: 'tunnel', description: 'Standard straight tunnel', themed: true, supportsRotation: true },
  { obName: '6x6_Tunnel_+2_Forest', category: 'tunnel', description: 'Tunnel with +2 elevation ramp', themed: true, supportsRotation: true },
  { obName: '6x6_Tunnel_CrossSection', category: 'tunnel', description: 'Tunnel cross-section (4-way)', themed: false },
  { obName: '6x6_Tunnel_TSection', category: 'tunnel', description: 'Tunnel T-section (3-way)', themed: false, supportsRotation: true },
];

// ============================================================
// TRENCH PIECES
// ============================================================
const TRENCH_ITEMS: CatalogItem[] = [
  { obName: '6x6_TrenchBase_Forest', category: 'trench', description: 'Standard trench base (straight)', themed: true, supportsRotation: true },
  { obName: '6x6_TrenchBase_+2_Forest', category: 'trench', description: 'Trench with +2 elevation', themed: true, supportsRotation: true },
  { obName: '6x6_TrenchBase_Cross_Forest', category: 'trench', description: 'Trench cross-section (4-way)', themed: true },
  { obName: '6x6_TrenchBase_Curve_Forest', category: 'trench', description: 'Trench curved section', themed: true, supportsRotation: true },
  { obName: '6x6_TrenchBase_Start_Forest', category: 'trench', description: 'Trench starting piece (one open end)', themed: true, supportsRotation: true },
  { obName: '6x6_TrenchBase_Tsection_Forest', category: 'trench', description: 'Trench T-section (3-way)', themed: true, supportsRotation: true },
];

// ============================================================
// TUBE/DROPDOWN PIECES
// ============================================================
const TUBE_ITEMS: CatalogItem[] = [
  { obName: '6x6_DropdownTube_Forest', category: 'tube', description: 'Standard dropdown tube', themed: true },
  { obName: '6x6_DropdownTube_LargeIndent_Forest', category: 'tube', description: 'Dropdown tube with large indent', themed: true },
  { obName: '2x4_Tube_Forest', category: 'tube', description: 'Small 2x4 tube connector', themed: true, supportsRotation: true },
  { obName: 'LargeTube', category: 'tube', description: 'Large tube connector', themed: false, supportsRotation: true },
];

// ============================================================
// HALFPIPE PIECES
// ============================================================
const HALFPIPE_ITEMS: CatalogItem[] = [
  { obName: '6x6HalfPipeRamp_Base_Forest', category: 'halfpipe', description: 'Half-pipe ramp base', themed: true, supportsRotation: true },
  { obName: 'Halfpipe_Tall_Forest', category: 'halfpipe', description: 'Tall half-pipe section', themed: true, supportsRotation: true },
  { obName: 'Halfpipehole_Tall_Forest', category: 'halfpipe', description: 'Tall half-pipe with hole', themed: true, supportsRotation: true },
];

// ============================================================
// LOG FLUME PIECES
// ============================================================
const LOGFLUME_ITEMS: CatalogItem[] = [
  { obName: 'LogFlumeStraight', category: 'logflume', description: 'Straight log flume section', themed: false, supportsRotation: true },
  { obName: 'LogFlumeCorner', category: 'logflume', description: 'Log flume corner', themed: false, supportsRotation: true },
  { obName: 'LogFlumeCornerHill', category: 'logflume', description: 'Log flume corner with hill', themed: false, supportsRotation: true },
  { obName: 'LogFlumeDivide', category: 'logflume', description: 'Log flume split/divide', themed: false, supportsRotation: true },
  { obName: 'LogFlumeEntrance', category: 'logflume', description: 'Log flume entrance ramp', themed: false, supportsRotation: true },
  { obName: 'LogFlumeHill', category: 'logflume', description: 'Log flume hill section', themed: false, supportsRotation: true },
  { obName: 'LogHolePlinko', category: 'logflume', description: 'Log with Plinko-style hole', themed: false },
];

// ============================================================
// SPECIAL FLOOR PIECES
// ============================================================
const SPECIAL_FLOOR_ITEMS: CatalogItem[] = [
  { obName: 'BalancePoint_Forest', category: 'special_floor', description: 'Balance point / teetering platform', themed: true },
  { obName: 'Blockslide_forest', category: 'special_floor', description: 'Sliding block floor', themed: false },
  { obName: 'BowlFunnel_Forest', category: 'special_floor', description: 'Bowl/funnel shaped floor', themed: true },
  { obName: 'BridgeArch_Hole_Forest', category: 'special_floor', description: 'Arched bridge with hole', themed: true },
  { obName: 'HighLowBumpBase_forest', category: 'special_floor', description: 'High-low bump floor pattern', themed: false },
  { obName: 'LowHighBumpBase_forest', category: 'special_floor', description: 'Low-high bump floor pattern', themed: false },
  { obName: 'Longjump_half_forest', category: 'special_floor', description: 'Long jump half platform', themed: false },
  { obName: 'SmallBridge_Forest', category: 'special_floor', description: 'Small bridge piece', themed: true, supportsRotation: true },
  { obName: 'SplitTheGap_NoSpinner_Forest', category: 'special_floor', description: 'Split gap floor (no spinner)', themed: true },
  { obName: 'QuarterSlide', category: 'special_floor', description: 'Quarter-pipe slide', themed: false, supportsRotation: true },
  { obName: 'CurvedLoop_Forest', category: 'special_floor', description: 'Curved loop-the-loop', themed: true, supportsRotation: true },
  { obName: 'Forest_Spiral', category: 'special_floor', description: 'Spiral descent platform', themed: true },
  { obName: '6x6_PlincoAngle_Forest', category: 'special_floor', description: 'Plinko-style angled floor', themed: true, supportsRotation: true },
  { obName: 'LargeLoop_Forest', category: 'special_floor', description: 'Large loop-the-loop', themed: true, supportsRotation: true },
  { obName: 'Base_6x6_HalfRamp', category: 'special_floor', description: 'Half-ramp base tile', themed: false, supportsRotation: true },
];

// ============================================================
// TRAPS & HAZARDS
// ============================================================
const TRAP_ITEMS: CatalogItem[] = [
  { obName: 'FlipGate', category: 'trap', description: 'Flip gate barrier', themed: false, supportsRotation: true },
  { obName: 'Fourwingspinner', category: 'trap', description: 'Four-wing spinner obstacle', themed: false, supportsRotation: true },
  { obName: 'F_Spinner6x6', category: 'trap', description: 'Spinning 6x6 floor', themed: false, hasFloor: true },
  { obName: 'GhostSpinner', category: 'trap', description: 'Floating ghost spinner', themed: false, yOffset: 3, photonViewID: [7] },
  { obName: 'Lightningstrike', category: 'trap', description: 'Lightning strike hazard', themed: false },
  { obName: 'Mine', category: 'trap', description: 'Explosive mine', themed: false, photonViewID: [3, 5] },
  { obName: 'OilDrum', category: 'trap', description: 'Explosive oil drum', themed: false, photonViewID: [4, 6] },
  { obName: 'FRock01', category: 'trap', description: 'Rock obstacle (small)', themed: false },
  { obName: 'FRock02', category: 'trap', description: 'Rock obstacle (large)', themed: false },
  { obName: 'H_WebSpinner', category: 'trap', description: 'Web spinner trap', themed: false, hasFloor: true },
  { obName: 'WalkingTurtle', category: 'trap', description: 'Walking turtle hazard', themed: false, supportsRotation: true },
  { obName: 'M_Spike', category: 'trap', description: 'Spike trap', themed: false },
  { obName: 'M_SpikeMetal', category: 'trap', description: 'Metal spike trap', themed: false },
  { obName: 'BucketSpinner_Forest', category: 'trap', description: 'Bucket spinner (with floor)', themed: true, hasFloor: true },
  { obName: 'Bucketspinner_standalone', category: 'trap', description: 'Bucket spinner (standalone)', themed: false },
  { obName: 'GingerbreadGoalie', category: 'trap', description: 'Gingerbread goalie blocker', themed: false },
  { obName: 'RollingBox', category: 'trap', description: 'Rolling box obstacle', themed: false },
  { obName: 'SpinningBarrel', category: 'trap', description: 'Spinning barrel', themed: false },
  { obName: 'Spin_Sorter', category: 'trap', description: 'Spinning sorter platform', themed: false },
  { obName: 'Swinggate_forest', category: 'trap', description: 'Swinging gate', themed: false, supportsRotation: true },
  { obName: 'TargetSpinner_Forest', category: 'trap', description: 'Target spinner obstacle', themed: true, supportsRotation: true },
  { obName: 'TargetStandDoor', category: 'trap', description: 'Target stand door', themed: false },
  { obName: 'TrapDoorHatch', category: 'trap', description: 'Trap door / hatch', themed: false },
  { obName: 'ShapedHoles_Circle', category: 'trap', description: 'Circle-shaped holes in floor', themed: false },
  { obName: 'ShapedHoles_Square', category: 'trap', description: 'Square-shaped holes in floor', themed: false },
  { obName: 'ShapedHoles_Triangle', category: 'trap', description: 'Triangle-shaped holes in floor', themed: false },
  { obName: 'ForestTarget', category: 'trap', description: 'Forest target (hit to activate)', themed: false },
];

// ============================================================
// MECHANICAL / INTERACTIVE
// ============================================================
const MECHANICAL_ITEMS: CatalogItem[] = [
  { obName: 'Lift_Root_Forest', category: 'mechanical', description: 'Elevator/lift platform', themed: true, photonViewID: [10] },
  { obName: 'WallElevator', category: 'mechanical', description: 'Wall-mounted elevator', themed: false },
  { obName: 'WaterWheel_Forest', category: 'mechanical', description: 'Water wheel obstacle', themed: true },
  { obName: 'Windmill_Feature_Forest', category: 'mechanical', description: 'Windmill feature', themed: true },
  { obName: 'GingerBreadMan', category: 'mechanical', description: 'Gingerbread man (moving)', themed: false },
];

// ============================================================
// WATER / LIQUID TYPES
// ============================================================
const WATER_ITEMS: CatalogItem[] = [
  { obName: 'Pirate_Water', category: 'water', description: 'Standard water (resets ball)', themed: false, defaultScale: { sX: 3, sY: 3, sZ: 3 } },
  { obName: 'Blood_Water', category: 'water', description: 'Blood water (resets ball)', themed: false, defaultScale: { sX: 3, sY: 3, sZ: 3 } },
  { obName: 'Lava', category: 'water', description: 'Lava (resets ball)', themed: false, defaultScale: { sX: 3, sY: 3, sZ: 3 } },
  { obName: 'Olympus_Water', category: 'water', description: 'Olympus-style water', themed: false, defaultScale: { sX: 3, sY: 3, sZ: 3 } },
  { obName: 'Lake_Water_Castle', category: 'water', description: 'Castle lake water', themed: false },
  { obName: 'GreenJellyWater_Bounds', category: 'water', description: 'Green jelly water (with bounds)', themed: false, defaultScale: { sX: 3, sY: 3, sZ: 3 } },
  { obName: 'PurpleJellyWater_Bounds', category: 'water', description: 'Purple jelly water (with bounds)', themed: false, defaultScale: { sX: 3, sY: 3, sZ: 3 } },
  { obName: 'Flowing Water Fast', category: 'water', description: 'Fast flowing water current', themed: false },
  { obName: 'Flowing Water Medium', category: 'water', description: 'Medium flowing water current', themed: false },
  { obName: 'Flowing Water Slow', category: 'water', description: 'Slow flowing water current', themed: false },
  { obName: 'Stationary Reset Water', category: 'water', description: 'Stationary water (resets ball)', themed: false },
  { obName: 'No Reset Water', category: 'water', description: 'Water that does NOT reset ball', themed: false },
  { obName: 'Bounds_LE', category: 'water', description: 'Invisible bounds/reset zone', themed: false },
];

// ============================================================
// SCENERY / DECORATIVE
// ============================================================
const SCENERY_ITEMS: CatalogItem[] = [
  // Trees & Plants
  { obName: 'BigRedPine01', category: 'scenery', description: 'Large red pine tree (variant 1)', themed: false, isScenery: true, defaultScale: { sX: 5, sY: 5, sZ: 5 } },
  { obName: 'BigRedPine02', category: 'scenery', description: 'Large red pine tree (variant 2)', themed: false, isScenery: true, defaultScale: { sX: 5, sY: 5, sZ: 5 } },
  { obName: 'ForestTree_Forest', category: 'scenery', description: 'Forest tree', themed: true, isScenery: true },
  { obName: 'Pinetree_Forest', category: 'scenery', description: 'Pine tree', themed: true, isScenery: true },
  { obName: 'Bush02', category: 'scenery', description: 'Bush', themed: false, isScenery: true },
  { obName: 'Fern_Wide', category: 'scenery', description: 'Wide fern plant', themed: false, isScenery: true },
  { obName: 'F_Fungus', category: 'scenery', description: 'Fungus/mushroom cluster', themed: false, isScenery: true },
  { obName: 'F_MushroomRED', category: 'scenery', description: 'Red mushroom', themed: false, isScenery: true },
  { obName: 'Flowers_Blue', category: 'scenery', description: 'Blue flowers', themed: false, isScenery: true },
  { obName: 'Flowers_Red', category: 'scenery', description: 'Red flowers', themed: false, isScenery: true },
  { obName: 'Plant_misc01', category: 'scenery', description: 'Miscellaneous plant', themed: false, isScenery: true },
  { obName: 'GrassFlat', category: 'scenery', description: 'Flat grass patch', themed: false, isScenery: true },
  { obName: 'LogJumpRedPine', category: 'scenery', description: 'Fallen log with red pine', themed: false, isScenery: true },
  { obName: 'LooseRockFlat', category: 'scenery', description: 'Flat loose rocks', themed: false, isScenery: true },
  // Animals
  { obName: 'F_STAG', category: 'scenery', description: 'Stag/deer decoration', themed: false, isScenery: true },
  // Buildings - Cabin
  { obName: 'Cabin01', category: 'scenery', description: 'Cabin (variant 1)', themed: false, isScenery: true },
  { obName: 'Cabin02', category: 'scenery', description: 'Cabin (variant 2)', themed: false, isScenery: true },
  { obName: 'Logcabin_Haunted', category: 'scenery', description: 'Haunted log cabin', themed: false, isScenery: true },
  // Buildings - Castle
  { obName: 'Castle_Building01', category: 'scenery', description: 'Castle building block', themed: false, isScenery: true },
  { obName: 'Castle_Cube', category: 'scenery', description: 'Castle cube block', themed: false, isScenery: true },
  { obName: 'Castle_Cubearch', category: 'scenery', description: 'Castle cube with arch', themed: false, isScenery: true },
  { obName: 'Castle_Drawbridge', category: 'scenery', description: 'Castle drawbridge', themed: false, isScenery: true },
  { obName: 'Castle_Gate', category: 'scenery', description: 'Castle gate', themed: false, isScenery: true },
  { obName: 'Castle_Premadewall', category: 'scenery', description: 'Castle pre-made wall section', themed: false, isScenery: true },
  { obName: 'Castle_Stairs', category: 'scenery', description: 'Castle stairs', themed: false, isScenery: true },
  { obName: 'Castle_Top', category: 'scenery', description: 'Castle top/battlement', themed: false, isScenery: true },
  { obName: 'Castle_TopCorner', category: 'scenery', description: 'Castle top corner piece', themed: false, isScenery: true },
  { obName: 'Castle_TopOneSide', category: 'scenery', description: 'Castle top one-side piece', themed: false, isScenery: true },
  { obName: 'Castle_TowerBlock', category: 'scenery', description: 'Castle tower block', themed: false, isScenery: true },
  { obName: 'Castle_TowerRoof', category: 'scenery', description: 'Castle tower roof', themed: false, isScenery: true },
  { obName: 'Castle_TowerTop', category: 'scenery', description: 'Castle tower top', themed: false, isScenery: true },
  { obName: 'Castle_WedgeCorner', category: 'scenery', description: 'Castle wedge corner', themed: false, isScenery: true },
  { obName: 'Castle_WedgeRoof', category: 'scenery', description: 'Castle wedge roof', themed: false, isScenery: true },
  { obName: 'Castle_WedgeRoofCorner', category: 'scenery', description: 'Castle wedge roof corner', themed: false, isScenery: true },
  { obName: 'Castle_Wedgewall', category: 'scenery', description: 'Castle wedge wall', themed: false, isScenery: true },
  { obName: 'Castle_Window', category: 'scenery', description: 'Castle window piece', themed: false, isScenery: true },
  // Buildings - Forest House
  { obName: 'FHouse_BaseRock', category: 'scenery', description: 'Forest house base/rock foundation', themed: false, isScenery: true },
  { obName: 'FHouseBase_6x6', category: 'scenery', description: 'Forest house 6x6 base', themed: false, isScenery: true },
  { obName: 'FHouseDoor', category: 'scenery', description: 'Forest house door', themed: false, isScenery: true },
  { obName: 'FHouseRoofEnd', category: 'scenery', description: 'Forest house roof end', themed: false, isScenery: true },
  { obName: 'FHouseRoofMiddle', category: 'scenery', description: 'Forest house roof middle', themed: false, isScenery: true },
  { obName: 'FHouseStairs', category: 'scenery', description: 'Forest house stairs', themed: false, isScenery: true },
  { obName: 'FHouseWindow', category: 'scenery', description: 'Forest house window', themed: false, isScenery: true },
  // Structures
  { obName: 'Forest_Sawmill', category: 'scenery', description: 'Sawmill building', themed: false, isScenery: true },
  { obName: 'Forest_Tower', category: 'scenery', description: 'Forest watch tower', themed: false, isScenery: true },
  { obName: 'Forest_Well', category: 'scenery', description: 'Stone well', themed: false, isScenery: true },
  { obName: 'WaterTower_Forest', category: 'scenery', description: 'Water tower', themed: true, isScenery: true },
  { obName: 'WheelHouse', category: 'scenery', description: 'Wheel house building', themed: false, isScenery: true },
  { obName: 'SawHouse', category: 'scenery', description: 'Saw house building', themed: false, isScenery: true },
  // Props
  { obName: 'Fire', category: 'scenery', description: 'Fire/campfire effect', themed: false, isScenery: true },
  { obName: 'Fireflys', category: 'scenery', description: 'Firefly particle effect', themed: false, isScenery: true },
  { obName: 'Bucket', category: 'scenery', description: 'Bucket prop', themed: false, isScenery: true },
  { obName: 'WoodBowl', category: 'scenery', description: 'Wooden bowl prop', themed: false, isScenery: true },
  { obName: 'Misc_Box', category: 'scenery', description: 'Miscellaneous box', themed: false, isScenery: true },
];

// ============================================================
// SIGNS
// ============================================================
const SIGN_ITEMS: CatalogItem[] = [
  { obName: 'ForestSign_Hole01', category: 'sign', description: 'Hole 1 sign', themed: false, isScenery: true },
  { obName: 'ForestSign_Hole02', category: 'sign', description: 'Hole 2 sign', themed: false, isScenery: true },
  { obName: 'ForestSign_Hole03', category: 'sign', description: 'Hole 3 sign', themed: false, isScenery: true },
  { obName: 'ForestSign_Hole04', category: 'sign', description: 'Hole 4 sign', themed: false, isScenery: true },
  { obName: 'ForestSign_Hole07', category: 'sign', description: 'Hole 7 sign', themed: false, isScenery: true },
  { obName: 'ForestSign_Hole17', category: 'sign', description: 'Hole 17 sign', themed: false, isScenery: true },
  { obName: 'ForestSign_Hole18', category: 'sign', description: 'Hole 18 sign', themed: false, isScenery: true },
  { obName: 'HSign_Bakery', category: 'sign', description: 'Hanging sign: Bakery', themed: false, isScenery: true },
  { obName: 'HSign_Blacksmith', category: 'sign', description: 'Hanging sign: Blacksmith', themed: false, isScenery: true },
  { obName: 'HSign_Butcher', category: 'sign', description: 'Hanging sign: Butcher', themed: false, isScenery: true },
];

// ============================================================
// BOOST / POWER-UPS
// ============================================================
const BOOST_ITEMS: CatalogItem[] = [
  { obName: 'BoostBox Fast', category: 'boost', description: 'Fast speed boost pad', themed: false, supportsRotation: true, defaultScale: { sX: 3, sY: 3, sZ: 3 } },
  { obName: 'BoostBox Medium', category: 'boost', description: 'Medium speed boost pad', themed: false, supportsRotation: true, defaultScale: { sX: 3, sY: 3, sZ: 3 } },
  { obName: 'BoostBox Slow', category: 'boost', description: 'Slow speed boost pad', themed: false, supportsRotation: true, defaultScale: { sX: 3, sY: 3, sZ: 3 } },
  { obName: 'RaceTurboBooster', category: 'boost', description: 'Race mode turbo booster', themed: false, supportsRotation: true },
  { obName: 'Powerup Spawner', category: 'boost', description: 'Power-up spawn point', themed: false, photonViewID: [5] },
];

// ============================================================
// FLAGS / GOAL MARKERS
// ============================================================
const FLAG_ITEMS: CatalogItem[] = [
  { obName: 'FlagPole_Forest', category: 'flag', description: 'Forest theme flagpole', themed: true, yOffset: -1 },
  { obName: 'FlagPole_CandyLand', category: 'flag', description: 'Candy theme flagpole', themed: false, yOffset: -1 },
  { obName: 'FlagPole_Oasis', category: 'flag', description: 'Oasis theme flagpole', themed: false, yOffset: -1 },
  { obName: 'FlagPole_Haunted', category: 'flag', description: 'Haunted theme flagpole', themed: false, yOffset: -1 },
  { obName: 'FlagPole_Ancient', category: 'flag', description: 'Ancient theme flagpole', themed: false, yOffset: -1 },
  { obName: 'CircleFlag', category: 'flag', description: 'Circular flag marker', themed: false },
  { obName: 'Racingflag', category: 'flag', description: 'Racing checkered flag', themed: false },
  { obName: 'Hoop_Editor', category: 'flag', description: 'Hoop goal (editor)', themed: false },
  { obName: 'Hoop_Space', category: 'flag', description: 'Space hoop goal', themed: false },
];

// ============================================================
// SPORTS MODE OBJECTS
// ============================================================
const SPORTS_ITEMS: CatalogItem[] = [
  { obName: 'HockeyCastle', category: 'sports', description: 'Hockey castle goal', themed: false, photonViewID: [7] },
  { obName: 'HockeyGoal', category: 'sports', description: 'Hockey goal', themed: false, photonViewID: [8] },
  { obName: 'HockeySpace', category: 'sports', description: 'Hockey space goal', themed: false, photonViewID: [9] },
];

// ============================================================
// CAMERA
// ============================================================
const CAMERA_ITEMS: CatalogItem[] = [
  { obName: 'LE_Camera_4_3', category: 'camera', description: 'Level editor camera (4:3)', themed: false, sType: 5, defaultScale: { sX: 0.5, sY: 0.5, sZ: 0.5 } },
];

// ============================================================
// COMBINED CATALOG
// ============================================================
export const FOREST_ITEM_CATALOG: CatalogItem[] = [
  ...FLOOR_ITEMS,
  ...HOLE_ITEMS,
  ...RAMP_ITEMS,
  ...WALL_ITEMS,
  ...FOUNDATION_ITEMS,
  ...TUNNEL_ITEMS,
  ...TRENCH_ITEMS,
  ...TUBE_ITEMS,
  ...HALFPIPE_ITEMS,
  ...LOGFLUME_ITEMS,
  ...SPECIAL_FLOOR_ITEMS,
  ...TRAP_ITEMS,
  ...MECHANICAL_ITEMS,
  ...WATER_ITEMS,
  ...SCENERY_ITEMS,
  ...SIGN_ITEMS,
  ...BOOST_ITEMS,
  ...FLAG_ITEMS,
  ...SPORTS_ITEMS,
  ...CAMERA_ITEMS,
];

/** Lookup map: obName -> CatalogItem */
export const ITEM_BY_NAME: Map<string, CatalogItem> = new Map(
  FOREST_ITEM_CATALOG.map(item => [item.obName, item])
);

/** Get all items in a category */
export function getItemsByCategory(category: ItemCategory): CatalogItem[] {
  return FOREST_ITEM_CATALOG.filter(item => item.category === category);
}

/** Get all available categories */
export function getCategories(): ItemCategory[] {
  return [...new Set(FOREST_ITEM_CATALOG.map(item => item.category))];
}

/** Get all obNames for a category */
export function getObNamesForCategory(category: ItemCategory): string[] {
  return getItemsByCategory(category).map(item => item.obName);
}

/** Find an item by obName (case-insensitive search) */
export function findItem(obName: string): CatalogItem | undefined {
  return ITEM_BY_NAME.get(obName) ??
    FOREST_ITEM_CATALOG.find(item => item.obName.toLowerCase() === obName.toLowerCase());
}
