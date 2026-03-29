import { randomUUID } from 'crypto';

export type Direction = 'north' | 'south' | 'east' | 'west';
export type RampDirection = 'RL' | 'DT' | 'LR' | 'TD';
export type Theme = 'Forest' | 'Oasis' | 'Space' | 'Pirate' | 'Haunted' | 'Candy';
export type WallOrientation = 'H' | 'V';

/** Maps user-facing theme names to the game's internal theme names */
export const THEME_TO_GAME_NAME: Record<Theme, string> = {
  Forest: 'Forest',
  Oasis: 'Oasis',
  Space: 'Space',
  Pirate: 'Pirate',
  Haunted: 'Haunted',
  Candy: 'CandyLand',
};

export type TrapType =
  | 'flipgate'
  | 'fourwingspinner'
  | 'ghostspinner'
  | 'lightningstrike'
  | 'mine'
  | 'oildrum'
  | 'rock'
  | 'spinningfloor'
  | 'walkingturtle'
  | 'webspinner';

export type RampType = 'ramp2' | 'sramp2' | 'largescurve3' | 'halframp';

export type ObjectType =
  | 'floor'
  | 'hole'
  | 'spawn'
  | 'flagpole'
  | 'wallH'
  | 'wallV'
  | 'foundationWallH'
  | 'foundationWallV'
  | 'ramp2'
  | 'ramp2FoundationWall'
  | 'ramp2Wall'
  | 'sramp2'
  | 'sramp2FoundationWall'
  | 'largeSCurve3'
  | 'largeSCurve3FoundationWall'
  | 'halfRamp'
  | 'dropdownTube'
  | 'water'
  | 'catalogItem'
  | TrapType;

export interface MapObject {
  id: number;
  uid: string;
  holeNumber: number;
  type: ObjectType;
  sType: number;
  pX: number;
  pY: number;
  pZ: number;
  rW: number;
  rX: number;
  rY: number;
  rZ: number;
  sX: number;
  sY: number;
  sZ: number;
  obName: string;
  photonData: { photonViewID: number[] };
  gridX?: number;
  gridZ?: number;
  spawnName?: string;
  par?: number;
  hidden?: boolean;
  /** Original catalog category (for catalogItem type) */
  catalogCategory?: string;
}

export function generateUid(): string {
  return randomUUID();
}

export interface MapState {
  levelName: string;
  description: string;
  music: number;
  skybox: number;
  theme: Theme;
  objects: MapObject[];
  holeCount: number;
  currentHoleNumber: number;
  undoStack: MapObject[][];
  wallStacks: number;
}

export interface GWYFMapJson {
  levelName: string;
  description: string;
  publishedID: number;
  music: number;
  skybox: number;
  visibleTerrain: boolean;
  directionalLightSettings: string;
  ambientLightSettings: string;
  selectionGroupsSettings: string;
  version: number;
  editorObjectData: GWYFEditorObject[];
}

export interface GWYFEditorObject {
  uid: string;
  sType: number;
  pX: number;
  pY: number;
  pZ: number;
  rW: number;
  rX: number;
  rY: number;
  rZ: number;
  sX: number;
  sY: number;
  sZ: number;
  obName: string;
  photonData: { photonViewID: number[] };
  spawnName?: string;
  par?: number;
}

/** Default light settings matching the game's defaults */
export const DEFAULT_DIRECTIONAL_LIGHT = '0|0.6666667|1|1|1|1|50|326';
export const DEFAULT_AMBIENT_LIGHT = '0.4|0.4|0.4|1';
export const DEFAULT_SELECTION_GROUPS = '';
export const MAP_VERSION = 1;

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export const GRID_SPACING = 6;
export const MAP_BOUNDS = { min: -245, max: 245 };
export const MAX_HOLES = 18;
export const DEFAULT_ELEVATION = 10.0;

export function gridToWorld(gridX: number, gridZ: number): { x: number; z: number } {
  return { x: gridX * GRID_SPACING, z: gridZ * GRID_SPACING };
}

export function worldToGrid(worldX: number, worldZ: number): { gridX: number; gridZ: number } {
  return { gridX: Math.round(worldX / GRID_SPACING), gridZ: Math.round(worldZ / GRID_SPACING) };
}

export function toolResult(data: any): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

export function toolError(message: string): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify({ error: message }) }], isError: true };
}
