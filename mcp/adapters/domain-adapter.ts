import {
  MapObject,
  ObjectType,
  Theme,
  Direction,
  RampDirection,
  RampType,
  TrapType,
  WallOrientation,
  GRID_SPACING,
  gridToWorld,
  DEFAULT_ELEVATION,
  THEME_TO_GAME_NAME,
} from '../state/types';
import { findItem, CatalogItem } from '../catalog/forest-items';

// Direction mapping: human-readable -> internal ramp codes
// The internal codes describe which direction the ramp ascends FROM -> TO
// e.g. 'TD' means the ramp goes from Top to Down (ascends toward south)
const DIRECTION_TO_RAMP: Record<Direction, RampDirection> = {
  north: 'DT',  // Ascends toward north = Down-to-Top
  south: 'TD',  // Ascends toward south = Top-to-Down
  east: 'LR',   // Ascends toward east = Left-to-Right
  west: 'RL',   // Ascends toward west = Right-to-Left
};

// Quaternion rotations for each ramp direction (rW, rY)
// Ramp2 rotations
const RAMP2_ROTATIONS: Record<RampDirection, { rW: number; rY: number }> = {
  RL: { rW: 1.0, rY: 0.0 },
  DT: { rW: 0.7071, rY: 0.7071 },
  LR: { rW: 0.0, rY: 1.0 },
  TD: { rW: -0.7071, rY: 0.7071 },
};

// Ramp2Wall rotations (different from Ramp2!)
const RAMP2WALL_ROTATIONS: Record<RampDirection, { rW: number; rY: number }> = {
  RL: { rW: 0.0, rY: 1.0 },
  DT: { rW: -0.7071, rY: 0.7071 },
  LR: { rW: 1.0, rY: 0.0 },
  TD: { rW: 0.7071, rY: 0.7071 },
};

// SRamp2 rotations (different from Ramp2!)
const SRAMP2_ROTATIONS: Record<RampDirection, { rW: number; rY: number }> = {
  RL: { rW: -0.7071, rY: 0.7071 },
  DT: { rW: 1.0, rY: 0.0 },
  LR: { rW: 0.7071, rY: 0.7071 },
  TD: { rW: 0.0, rY: 1.0 },
};

// SRamp2FoundationWall rotations
const SRAMP2FW_ROTATIONS: Record<RampDirection, { rW: number; rY: number }> = {
  RL: { rW: 0.7071, rY: 0.7071 },
  DT: { rW: 0.0, rY: 1.0 },
  LR: { rW: -0.7071, rY: 0.7071 },
  TD: { rW: 1.0, rY: 0.0 },
};

// Trap definitions
const TRAP_DEFS: Record<TrapType, {
  obName: string;
  yOffset: number;
  photonViewID: number[];
  hasFloor: boolean;
  hasOrientation: boolean;
}> = {
  flipgate:        { obName: 'FlipGate',       yOffset: 0, photonViewID: [],     hasFloor: false, hasOrientation: true },
  fourwingspinner: { obName: 'Fourwingspinner', yOffset: 0, photonViewID: [],     hasFloor: false, hasOrientation: false },
  ghostspinner:    { obName: 'GhostSpinner',    yOffset: 3, photonViewID: [7],    hasFloor: false, hasOrientation: false },
  lightningstrike: { obName: 'Lightningstrike', yOffset: 0, photonViewID: [],     hasFloor: false, hasOrientation: false },
  mine:            { obName: 'Mine',            yOffset: 0, photonViewID: [3, 5], hasFloor: false, hasOrientation: false },
  oildrum:         { obName: 'OilDrum',         yOffset: 0, photonViewID: [4, 6], hasFloor: false, hasOrientation: false },
  rock:            { obName: 'FRock01',         yOffset: 0, photonViewID: [],     hasFloor: false, hasOrientation: false },
  spinningfloor:   { obName: 'F_Spinner6x6',   yOffset: 0, photonViewID: [],     hasFloor: true,  hasOrientation: false },
  walkingturtle:   { obName: 'WalkingTurtle',   yOffset: 0, photonViewID: [],     hasFloor: false, hasOrientation: false },
  webspinner:      { obName: 'H_WebSpinner',    yOffset: 0, photonViewID: [],     hasFloor: true,  hasOrientation: false },
};

export class DomainAdapter {
  private theme: Theme;

  constructor(theme: Theme = 'Forest') {
    this.theme = theme;
  }

  setTheme(theme: Theme) {
    this.theme = theme;
  }

  directionToRamp(dir: Direction): RampDirection {
    return DIRECTION_TO_RAMP[dir];
  }

  createFloor(gridX: number, gridZ: number, elevation: number, holeNumber: number): Omit<MapObject, 'id' | 'uid'> {
    const { x, z } = gridToWorld(gridX, gridZ);
    return {
      holeNumber,
      type: 'floor',
      sType: 0,
      pX: x, pY: elevation, pZ: z,
      rW: 1.0, rX: 0.0, rY: 0.0, rZ: 0.0,
      sX: 1.0, sY: 1.0, sZ: 1.0,
      obName: `6x6_Base_${this.getGameThemeName()}`,
      photonData: { photonViewID: [] },
      gridX, gridZ,
    };
  }

  createHole(gridX: number, gridZ: number, elevation: number, holeNumber: number, hidden?: boolean): Omit<MapObject, 'id' | 'uid'> {
    const { x, z } = gridToWorld(gridX, gridZ);
    return {
      holeNumber,
      type: 'hole',
      sType: 0,
      pX: x, pY: elevation, pZ: z,
      rW: 1.0, rX: 0.0, rY: 0.0, rZ: 0.0,
      sX: 1.0, sY: 1.0, sZ: 1.0,
      obName: `6x6HoleFlat_Base_${this.getGameThemeName()}`,
      photonData: { photonViewID: [] },
      gridX, gridZ,
      hidden,
    };
  }

  createSpawn(gridX: number, gridZ: number, elevation: number, holeNumber: number, par: number = 99): Omit<MapObject, 'id' | 'uid'> {
    const { x, z } = gridToWorld(gridX, gridZ);
    return {
      holeNumber,
      type: 'spawn',
      sType: 4,
      pX: x, pY: elevation, pZ: z,
      rW: 0.0, rX: 0.0, rY: 1.0, rZ: 0.0,
      sX: 1.0, sY: 1.0, sZ: 1.0,
      obName: 'SingleSpawn',
      photonData: { photonViewID: [] },
      gridX, gridZ,
      spawnName: `Spawn${holeNumber}`,
      par,
    };
  }

  createFlagpole(gridX: number, gridZ: number, elevation: number, holeNumber: number): Omit<MapObject, 'id' | 'uid'> {
    const { x, z } = gridToWorld(gridX, gridZ);
    return {
      holeNumber,
      type: 'flagpole',
      sType: 0,
      pX: x, pY: elevation - 1.0, pZ: z,  // Flagpole has -1.0 Y offset
      rW: 1.0, rX: 0.0, rY: 0.0, rZ: 0.0,
      sX: 1.0, sY: 1.0, sZ: 1.0,
      obName: `FlagPole_${this.getGameThemeName()}`,
      photonData: { photonViewID: [] },
      gridX, gridZ,
    };
  }

  createWallH(gridX: number, gridZ: number, elevation: number, holeNumber: number): Omit<MapObject, 'id' | 'uid'> {
    const { x, z } = gridToWorld(gridX, gridZ);
    return {
      holeNumber,
      type: 'wallH',
      sType: 0,
      pX: x, pY: elevation, pZ: z,
      rW: 1.0, rX: 0.0, rY: 0.0, rZ: 0.0,
      sX: 1.0, sY: 2.0, sZ: 1.0,
      obName: `1x6_Wall_${this.getGameThemeName()}`,
      photonData: { photonViewID: [] },
      gridX, gridZ,
    };
  }

  createWallV(gridX: number, gridZ: number, elevation: number, holeNumber: number): Omit<MapObject, 'id' | 'uid'> {
    const { x, z } = gridToWorld(gridX, gridZ);
    return {
      holeNumber,
      type: 'wallV',
      sType: 0,
      pX: x, pY: elevation, pZ: z,
      rW: 0.7071, rX: 0.0, rY: 0.7071, rZ: 0.0,
      sX: 1.0, sY: 2.0, sZ: 1.0,
      obName: `1x6_Wall_${this.getGameThemeName()}`,
      photonData: { photonViewID: [] },
      gridX, gridZ,
    };
  }

  createFoundationWallH(gridX: number, gridZ: number, elevation: number, holeNumber: number): Omit<MapObject, 'id' | 'uid'> {
    const { x, z } = gridToWorld(gridX, gridZ);
    return {
      holeNumber,
      type: 'foundationWallH',
      sType: 0,
      pX: x, pY: elevation, pZ: z,
      rW: 1.0, rX: 0.0, rY: 0.0, rZ: 0.0,
      sX: 1.0, sY: 1.0, sZ: 1.0,
      obName: `6x6Foundation_Wall_${this.getGameThemeName()}`,
      photonData: { photonViewID: [] },
      gridX, gridZ,
    };
  }

  createFoundationWallV(gridX: number, gridZ: number, elevation: number, holeNumber: number): Omit<MapObject, 'id' | 'uid'> {
    const { x, z } = gridToWorld(gridX, gridZ);
    return {
      holeNumber,
      type: 'foundationWallV',
      sType: 0,
      pX: x, pY: elevation, pZ: z,
      rW: 0.7071, rX: 0.0, rY: 0.7071, rZ: 0.0,
      sX: 1.0, sY: 1.0, sZ: 1.0,
      obName: `6x6Foundation_Wall_${this.getGameThemeName()}`,
      photonData: { photonViewID: [] },
      gridX, gridZ,
    };
  }

  createRamp2(gridX: number, gridZ: number, elevation: number, dir: Direction, holeNumber: number): Omit<MapObject, 'id' | 'uid'> {
    const { x, z } = gridToWorld(gridX, gridZ);
    const rampDir = DIRECTION_TO_RAMP[dir];
    const rot = RAMP2_ROTATIONS[rampDir];
    return {
      holeNumber,
      type: 'ramp2',
      sType: 0,
      pX: x, pY: elevation + 2, pZ: z,  // +2 Y offset
      rW: rot.rW, rX: 0.0, rY: rot.rY, rZ: 0.0,
      sX: 1.0, sY: 1.0, sZ: 1.0,
      obName: `6x6Ramp+2_Base_${this.getGameThemeName()}`,
      photonData: { photonViewID: [] },
      gridX, gridZ,
    };
  }

  createRamp2FoundationWall(worldX: number, worldZ: number, elevation: number, dir: Direction, holeNumber: number): Omit<MapObject, 'id' | 'uid'> {
    const rampDir = DIRECTION_TO_RAMP[dir];
    const rot = RAMP2_ROTATIONS[rampDir];
    return {
      holeNumber,
      type: 'ramp2FoundationWall',
      sType: 0,
      pX: worldX, pY: elevation - 1, pZ: worldZ,  // -1 Y offset
      rW: rot.rW, rX: 0.0, rY: rot.rY, rZ: 0.0,
      sX: 1.0, sY: 1.0, sZ: 1.0,
      obName: `6x6+2Foundation_Wall_${this.getGameThemeName()}`,
      photonData: { photonViewID: [] },
    };
  }

  createRamp2Wall(worldX: number, worldZ: number, elevation: number, dir: Direction, holeNumber: number): Omit<MapObject, 'id' | 'uid'> {
    const rampDir = DIRECTION_TO_RAMP[dir];
    const rot = RAMP2WALL_ROTATIONS[rampDir];
    return {
      holeNumber,
      type: 'ramp2Wall',
      sType: 0,
      pX: worldX, pY: elevation, pZ: worldZ,
      rW: rot.rW, rX: 0.0, rY: rot.rY, rZ: 0.0,
      sX: 1.0, sY: 1.0, sZ: 1.0,
      obName: `1x6Ramp+2_Wall_${this.getGameThemeName()}`,
      photonData: { photonViewID: [] },
    };
  }

  createSRamp2(gridX: number, gridZ: number, elevation: number, dir: Direction, holeNumber: number): Omit<MapObject, 'id' | 'uid'> {
    const { x, z } = gridToWorld(gridX, gridZ);
    const rampDir = DIRECTION_TO_RAMP[dir];
    const rot = SRAMP2_ROTATIONS[rampDir];
    return {
      holeNumber,
      type: 'sramp2',
      sType: 0,
      pX: x, pY: elevation, pZ: z,
      rW: rot.rW, rX: 0.0, rY: rot.rY, rZ: 0.0,
      sX: 1.0, sY: 1.0, sZ: 1.0,
      obName: `6x6_S-ramp_${this.getGameThemeName()}`,
      photonData: { photonViewID: [] },
      gridX, gridZ,
    };
  }

  createSRamp2FoundationWall(worldX: number, worldZ: number, elevation: number, dir: Direction, holeNumber: number): Omit<MapObject, 'id' | 'uid'> {
    const rampDir = DIRECTION_TO_RAMP[dir];
    const rot = SRAMP2FW_ROTATIONS[rampDir];
    return {
      holeNumber,
      type: 'sramp2FoundationWall',
      sType: 0,
      pX: worldX, pY: elevation, pZ: worldZ,
      rW: rot.rW, rX: 0.0, rY: rot.rY, rZ: 0.0,
      sX: 1.0, sY: 1.0, sZ: 1.0,
      obName: 'Wall_Foundation 6x6_smooth+2',
      photonData: { photonViewID: [] },
    };
  }

  createLargeSCurve3(gridX: number, gridZ: number, elevation: number, dir: Direction, holeNumber: number): Omit<MapObject, 'id' | 'uid'> {
    const { x, z } = gridToWorld(gridX, gridZ);
    const rampDir = DIRECTION_TO_RAMP[dir];
    const rot = RAMP2_ROTATIONS[rampDir]; // Same rotation mapping as Ramp2
    return {
      holeNumber,
      type: 'largeSCurve3',
      sType: 0,
      pX: x, pY: elevation, pZ: z,
      rW: rot.rW, rX: 0.0, rY: rot.rY, rZ: 0.0,
      sX: 1.0, sY: 1.0, sZ: 1.0,
      obName: `Large_SCurve_${this.getGameThemeName()}`,
      photonData: { photonViewID: [] },
      gridX, gridZ,
    };
  }

  createLargeSCurve3FoundationWall(worldX: number, worldZ: number, elevation: number, dir: Direction, holeNumber: number): Omit<MapObject, 'id' | 'uid'> {
    const rampDir = DIRECTION_TO_RAMP[dir];
    const rot = RAMP2_ROTATIONS[rampDir];
    return {
      holeNumber,
      type: 'largeSCurve3FoundationWall',
      sType: 0,
      pX: worldX, pY: elevation - 1, pZ: worldZ,
      rW: rot.rW, rX: 0.0, rY: rot.rY, rZ: 0.0,
      sX: 1.0, sY: 1.0, sZ: 1.0,
      obName: `Large_SCurve_${this.getGameThemeName()}_Foundation`,
      photonData: { photonViewID: [] },
    };
  }

  createHalfRamp(gridX: number, gridZ: number, elevation: number, dir: Direction, holeNumber: number): Omit<MapObject, 'id' | 'uid'> {
    const { x, z } = gridToWorld(gridX, gridZ);
    const rampDir = DIRECTION_TO_RAMP[dir];
    const rot = RAMP2_ROTATIONS[rampDir];
    return {
      holeNumber,
      type: 'halfRamp',
      sType: 0,
      pX: x, pY: elevation - 1, pZ: z,  // -1 Y offset
      rW: rot.rW, rX: 0.0, rY: rot.rY, rZ: 0.0,
      sX: 1.0, sY: 1.0, sZ: 1.0,
      obName: 'Base_6x6_HalfRamp',
      photonData: { photonViewID: [] },
      gridX, gridZ,
    };
  }

  createDropdownTube(gridX: number, gridZ: number, elevation: number, holeNumber: number): Omit<MapObject, 'id' | 'uid'> {
    const { x, z } = gridToWorld(gridX, gridZ);
    return {
      holeNumber,
      type: 'dropdownTube',
      sType: 0,
      pX: x, pY: elevation, pZ: z,
      rW: 1.0, rX: 0.0, rY: 0.0, rZ: 0.0,
      sX: 1.0, sY: 1.0, sZ: 1.0,
      obName: `6x6_DropdownTube_${this.getGameThemeName()}`,
      photonData: { photonViewID: [] },
      gridX, gridZ,
    };
  }

  createWater(gridX: number, gridZ: number, elevation: number, holeNumber: number): Omit<MapObject, 'id' | 'uid'> {
    const { x, z } = gridToWorld(gridX, gridZ);
    return {
      holeNumber,
      type: 'water',
      sType: 0,
      pX: x, pY: elevation - 1.5, pZ: z,  // -1.5 Y offset
      rW: 1.0, rX: 0.0, rY: 0.0, rZ: 0.0,
      sX: 6.0, sY: 3.0, sZ: 6.0,  // Special scale
      obName: 'Pirate_Water',  // Hardcoded Pirate
      photonData: { photonViewID: [] },
      gridX, gridZ,
    };
  }

  createTrap(gridX: number, gridZ: number, elevation: number, trapType: TrapType, holeNumber: number, orientation?: WallOrientation): Omit<MapObject, 'id' | 'uid'> {
    const { x, z } = gridToWorld(gridX, gridZ);
    const def = TRAP_DEFS[trapType];

    let rW = 1.0, rY = 0.0;
    if (trapType === 'flipgate' && orientation === 'V') {
      rW = 0.7071;
      rY = 0.7071;
    }

    return {
      holeNumber,
      type: trapType,
      sType: 0,
      pX: x, pY: elevation + def.yOffset, pZ: z,
      rW, rX: 0.0, rY, rZ: 0.0,
      sX: 1.0, sY: 1.0, sZ: 1.0,
      obName: def.obName,
      photonData: { photonViewID: [...def.photonViewID] },
      gridX, gridZ,
    };
  }

  trapHasFloor(trapType: TrapType): boolean {
    return TRAP_DEFS[trapType].hasFloor;
  }

  // Place a wall on a specific side of a tile
  createWallOnSide(gridX: number, gridZ: number, side: Direction, elevation: number, holeNumber: number): Omit<MapObject, 'id' | 'uid'> {
    const { x, z } = gridToWorld(gridX, gridZ);
    const halfGrid = GRID_SPACING / 2; // 3

    switch (side) {
      case 'north':
        return this.createWallH(gridX, gridZ, elevation, holeNumber);
      case 'south':
        return { ...this.createWallH(gridX, gridZ, elevation, holeNumber), pZ: z - halfGrid };
      case 'east':
        return { ...this.createWallV(gridX, gridZ, elevation, holeNumber), pX: x + halfGrid };
      case 'west':
        return { ...this.createWallV(gridX, gridZ, elevation, holeNumber), pX: x - halfGrid };
    }
  }

  /** Get the game-internal theme name (e.g. 'CandyLand' for 'Candy') */
  getGameThemeName(): string {
    return THEME_TO_GAME_NAME[this.theme];
  }

  /**
   * Generic factory: create any item from the catalog by obName.
   * Handles themed name substitution, default scales, y-offsets, and photonData.
   */
  createCatalogItem(
    obName: string,
    gridX: number,
    gridZ: number,
    elevation: number,
    holeNumber: number,
    options?: {
      rotation?: { rW: number; rX: number; rY: number; rZ: number };
      scale?: { sX: number; sY: number; sZ: number };
    }
  ): Omit<MapObject, 'id' | 'uid'> {
    const catalogItem = findItem(obName);
    const { x, z } = gridToWorld(gridX, gridZ);

    // Resolve the actual obName (apply theme suffix if needed)
    let resolvedObName = obName;
    if (catalogItem?.themed) {
      // Replace theme suffix in the obName with the current theme
      const gameName = this.getGameThemeName();
      resolvedObName = obName.replace(/_(Forest|CandyLand|Oasis|Space|Pirate|Haunted)$/, `_${gameName}`);
      // Handle items like "Longramp_forest" (lowercase)
      resolvedObName = resolvedObName.replace(/_(forest|candyland|oasis|space|pirate|haunted)$/, `_${gameName.toLowerCase()}`);
    }

    const yOffset = catalogItem?.yOffset ?? 0;
    const defaultScale = catalogItem?.defaultScale ?? { sX: 1, sY: 1, sZ: 1 };
    const sType = catalogItem?.sType ?? 0;
    const photonViewID = catalogItem?.photonViewID ? [...catalogItem.photonViewID] : [];

    const rot = options?.rotation ?? { rW: 1.0, rX: 0.0, rY: 0.0, rZ: 0.0 };
    const scale = options?.scale ?? defaultScale;

    return {
      holeNumber,
      type: 'catalogItem',
      sType,
      pX: x,
      pY: elevation + yOffset,
      pZ: z,
      rW: rot.rW,
      rX: rot.rX,
      rY: rot.rY,
      rZ: rot.rZ,
      sX: scale.sX,
      sY: scale.sY,
      sZ: scale.sZ,
      obName: resolvedObName,
      photonData: { photonViewID },
      gridX,
      gridZ,
      catalogCategory: catalogItem?.category,
    };
  }

  // Create a ramp with its foundation walls (matching terrain builder logic)
  createRampWithFoundation(
    gridX: number,
    gridZ: number,
    elevation: number,
    dir: Direction,
    holeNumber: number,
    rampType: RampType = 'ramp2',
    includeWalls: boolean = false
  ): Omit<MapObject, 'id' | 'uid'>[] {
    const { x, z } = gridToWorld(gridX, gridZ);
    const halfGrid = GRID_SPACING / 2;
    const result: Omit<MapObject, 'id' | 'uid'>[] = [];

    switch (rampType) {
      case 'ramp2': {
        result.push(this.createRamp2(gridX, gridZ, elevation, dir, holeNumber));

        // Foundation walls on the sides perpendicular to ramp direction
        if (dir === 'north' || dir === 'south') {
          result.push(this.createRamp2FoundationWall(x - halfGrid, z, elevation, dir, holeNumber));
          result.push(this.createRamp2FoundationWall(x + halfGrid, z, elevation, dir, holeNumber));
          result.push(this.createFoundationWallH(gridX, gridZ, elevation, holeNumber));
          if (includeWalls) {
            result.push(this.createRamp2Wall(x - halfGrid, z, elevation, dir, holeNumber));
            result.push(this.createRamp2Wall(x + halfGrid, z, elevation, dir, holeNumber));
          }
        } else {
          result.push(this.createRamp2FoundationWall(x, z - halfGrid, elevation, dir, holeNumber));
          result.push(this.createRamp2FoundationWall(x, z + halfGrid, elevation, dir, holeNumber));
          result.push(this.createFoundationWallV(gridX, gridZ, elevation, holeNumber));
          if (includeWalls) {
            result.push(this.createRamp2Wall(x, z - halfGrid, elevation, dir, holeNumber));
            result.push(this.createRamp2Wall(x, z + halfGrid, elevation, dir, holeNumber));
          }
        }
        break;
      }
      case 'sramp2': {
        result.push(this.createSRamp2(gridX, gridZ, elevation, dir, holeNumber));
        break;
      }
      case 'largescurve3': {
        result.push(this.createLargeSCurve3(gridX, gridZ, elevation, dir, holeNumber));
        break;
      }
      case 'halframp': {
        result.push(this.createHalfRamp(gridX, gridZ, elevation, dir, holeNumber));
        break;
      }
    }

    return result;
  }
}
