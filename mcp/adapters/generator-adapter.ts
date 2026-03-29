import { MapObject, MapState, GWYFEditorObject, ObjectType } from '../state/types';
import { Global } from '../../config';
import { MazeBuilder } from '../../generator/mazebuilder';
import { TerrainBuilder } from '../../generator/terrainbuilder';

// Infer object type from its obName
function inferType(obName: string, sType: number): ObjectType {
  if (sType === 4) return 'spawn';
  if (obName.startsWith('6x6_Base_')) return 'floor';
  if (obName.startsWith('6x6HoleFlat_Base_')) return 'hole';
  if (obName.startsWith('FlagPole_')) return 'flagpole';
  if (obName.startsWith('1x6_Wall_')) return 'wallH'; // Could be wallV based on rotation
  if (obName.startsWith('6x6Foundation_Wall_')) return 'foundationWallH';
  if (obName.startsWith('6x6Ramp+2_Base_')) return 'ramp2';
  if (obName.startsWith('6x6+2Foundation_Wall_')) return 'ramp2FoundationWall';
  if (obName.startsWith('1x6Ramp+2_Wall_')) return 'ramp2Wall';
  if (obName.startsWith('6x6_S-ramp_')) return 'sramp2';
  if (obName.startsWith('Wall_Foundation 6x6_smooth')) return 'sramp2FoundationWall';
  if (obName.startsWith('Large_SCurve_') && obName.includes('Foundation')) return 'largeSCurve3FoundationWall';
  if (obName.startsWith('Large_SCurve_')) return 'largeSCurve3';
  if (obName === 'Base_6x6_HalfRamp') return 'halfRamp';
  if (obName.startsWith('6x6_DropdownTube_')) return 'dropdownTube';
  if (obName === 'Pirate_Water') return 'water';
  // Traps
  if (obName === 'FlipGate') return 'flipgate';
  if (obName === 'Fourwingspinner') return 'fourwingspinner';
  if (obName === 'GhostSpinner') return 'ghostspinner';
  if (obName === 'Lightningstrike') return 'lightningstrike';
  if (obName === 'Mine') return 'mine';
  if (obName === 'OilDrum') return 'oildrum';
  if (obName === 'FRock01') return 'rock';
  if (obName === 'F_Spinner6x6') return 'spinningfloor';
  if (obName === 'WalkingTurtle') return 'walkingturtle';
  if (obName === 'H_WebSpinner') return 'webspinner';
  return 'floor'; // fallback
}

// Disambiguate wallH/wallV based on rotation
function refineWallType(obj: GWYFEditorObject, type: ObjectType): ObjectType {
  if (type === 'wallH' && Math.abs(obj.rW - 0.7071) < 0.01) {
    return 'wallV';
  }
  if (type === 'foundationWallH' && Math.abs(obj.rW - 0.7071) < 0.01) {
    return 'foundationWallV';
  }
  return type;
}

function parseGeneratorOutput(jsonString: string, holeNumber: number, startId: number): { objects: Omit<MapObject, 'id' | 'uid'>[]; nextId: number } {
  const parsed = JSON.parse(jsonString);
  const editorData: GWYFEditorObject[] = parsed.editorObjectData;
  const objects: Omit<MapObject, 'id' | 'uid'>[] = [];

  for (const obj of editorData) {
    let type = inferType(obj.obName, obj.sType);
    type = refineWallType(obj, type);

    const mapObj: Omit<MapObject, 'id' | 'uid'> = {
      holeNumber,
      type,
      sType: obj.sType,
      pX: obj.pX,
      pY: obj.pY,
      pZ: obj.pZ,
      rW: obj.rW,
      rX: obj.rX,
      rY: obj.rY,
      rZ: obj.rZ,
      sX: obj.sX,
      sY: obj.sY,
      sZ: obj.sZ,
      obName: obj.obName,
      photonData: obj.photonData,
    };

    if (obj.spawnName) {
      mapObj.spawnName = `Spawn ${holeNumber}`;
      mapObj.par = obj.par ?? 99;
    }

    objects.push(mapObj);
  }

  return { objects, nextId: startId + objects.length };
}

export function generateMaze(params: {
  holeNumber: number;
  width: number;
  height: number;
  mapName: string;
  theme: string;
  trapProbability?: number;
  wallStacks?: number;
  elevation?: number;
  includeSpawnAndHole?: boolean;
}): Omit<MapObject, 'id' | 'uid'>[] {
  // Save and restore Global state
  const savedGlobal = {
    theme: Global.theme,
    type: Global.type,
    y: Global.y,
    wallStacks: Global.wallStacks,
    trapProbability: Global.trapProbability,
    basic: Global.basic,
  };

  try {
    Global.theme = params.theme;
    Global.type = 'single';
    Global.y = params.elevation ?? 10.0;
    Global.wallStacks = params.wallStacks ?? 1;
    Global.trapProbability = params.trapProbability ?? 0.2;
    Global.basic = params.includeSpawnAndHole === false;

    // Suppress console.log from generators
    const origLog = console.log;
    console.log = () => {};

    const builder = new MazeBuilder(params.mapName, params.width, params.height);
    const jsonString = builder.build();

    console.log = origLog;

    const { objects } = parseGeneratorOutput(jsonString, params.holeNumber, 1);
    return objects;
  } finally {
    Global.theme = savedGlobal.theme;
    Global.type = savedGlobal.type;
    Global.y = savedGlobal.y;
    Global.wallStacks = savedGlobal.wallStacks;
    Global.trapProbability = savedGlobal.trapProbability;
    Global.basic = savedGlobal.basic;
  }
}

export function generateTerrain(params: {
  holeNumber: number;
  width: number;
  height: number;
  mapName: string;
  theme: string;
  evenness?: number;
  steepness?: number;
  wallStacks?: number;
  water?: boolean;
}): Omit<MapObject, 'id' | 'uid'>[] {
  const savedGlobal = {
    theme: Global.theme,
    type: Global.type,
    y: Global.y,
    wallStacks: Global.wallStacks,
    evennessCoefficient: Global.evennessCoefficient,
    steepness: Global.steepness,
    water: Global.water,
    basic: Global.basic,
  };

  try {
    Global.theme = params.theme;
    Global.type = 'terrain';
    Global.wallStacks = params.wallStacks ?? 1;
    Global.evennessCoefficient = params.evenness ?? 1;
    Global.steepness = params.steepness ?? 2;
    Global.water = params.water ? 1 : 0;
    Global.basic = true; // Terrain generator doesn't place spawn/hole by default

    const origLog = console.log;
    console.log = () => {};

    const builder = new TerrainBuilder(params.mapName, params.width, params.height);
    const jsonString = builder.build(params.width, params.height);

    console.log = origLog;

    const { objects } = parseGeneratorOutput(jsonString, params.holeNumber, 1);
    return objects;
  } finally {
    Global.theme = savedGlobal.theme;
    Global.type = savedGlobal.type;
    Global.y = savedGlobal.y;
    Global.wallStacks = savedGlobal.wallStacks;
    Global.evennessCoefficient = savedGlobal.evennessCoefficient;
    Global.steepness = savedGlobal.steepness;
    Global.water = savedGlobal.water;
    Global.basic = savedGlobal.basic;
  }
}
