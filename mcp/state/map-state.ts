import {
  MapObject,
  MapState,
  GWYFMapJson,
  GWYFEditorObject,
  Theme,
  ObjectType,
  DEFAULT_ELEVATION,
} from './types';

export class MapStateManager {
  private state: MapState | null = null;
  private nextId = 1;

  create(
    name: string,
    theme: Theme = 'Forest',
    holeCount: number = 1,
    music: number = 8,
    skybox: number = 9,
    description: string = 'AI-generated GWYF map'
  ): MapState {
    this.nextId = 1;
    this.state = {
      levelName: name,
      description,
      music,
      skybox,
      theme,
      objects: [],
      holeCount,
      currentHoleNumber: 1,
      undoStack: [],
      wallStacks: 1,
    };
    return this.state;
  }

  getState(): MapState {
    if (!this.state) {
      throw new Error('No map created. Call create_map first.');
    }
    return this.state;
  }

  hasMap(): boolean {
    return this.state !== null;
  }

  addObject(obj: Omit<MapObject, 'id'>): MapObject {
    const state = this.getState();
    const mapObj: MapObject = { ...obj, id: this.nextId++ };
    state.undoStack.push([{ ...mapObj }]);
    state.objects.push(mapObj);
    return mapObj;
  }

  addObjects(objs: Omit<MapObject, 'id'>[]): MapObject[] {
    const state = this.getState();
    const added: MapObject[] = [];
    const undoBatch: MapObject[] = [];
    for (const obj of objs) {
      const mapObj: MapObject = { ...obj, id: this.nextId++ };
      state.objects.push(mapObj);
      added.push(mapObj);
      undoBatch.push({ ...mapObj });
    }
    state.undoStack.push(undoBatch);
    return added;
  }

  removeObjects(filter: {
    holeNumber?: number;
    type?: ObjectType;
    gridX?: number;
    gridZ?: number;
    radius?: number;
  }): number {
    const state = this.getState();
    const before = state.objects.length;
    const radius = filter.radius ?? 0;

    state.objects = state.objects.filter((obj) => {
      if (filter.holeNumber !== undefined && obj.holeNumber !== filter.holeNumber) return true;
      if (filter.type !== undefined && obj.type !== filter.type) return true;
      if (filter.gridX !== undefined && filter.gridZ !== undefined) {
        const dx = Math.abs((obj.gridX ?? 0) - filter.gridX);
        const dz = Math.abs((obj.gridZ ?? 0) - filter.gridZ);
        if (dx > radius || dz > radius) return true;
      }
      return false;
    });

    return before - state.objects.length;
  }

  getObjects(filter?: {
    holeNumber?: number;
    type?: ObjectType;
    gridX?: number;
    gridZ?: number;
    limit?: number;
  }): MapObject[] {
    const state = this.getState();
    let result = state.objects;

    if (filter) {
      if (filter.holeNumber !== undefined)
        result = result.filter((o) => o.holeNumber === filter.holeNumber);
      if (filter.type !== undefined)
        result = result.filter((o) => o.type === filter.type);
      if (filter.gridX !== undefined)
        result = result.filter((o) => o.gridX === filter.gridX);
      if (filter.gridZ !== undefined)
        result = result.filter((o) => o.gridZ === filter.gridZ);
      if (filter.limit !== undefined)
        result = result.slice(0, filter.limit);
    }

    return result;
  }

  undo(): { undone: number } {
    const state = this.getState();
    const batch = state.undoStack.pop();
    if (!batch) return { undone: 0 };

    const idsToRemove = new Set(batch.map((o) => o.id));
    state.objects = state.objects.filter((o) => !idsToRemove.has(o.id));
    return { undone: batch.length };
  }

  serialize(): string {
    const state = this.getState();

    const editorObjectData: GWYFEditorObject[] = state.objects.map((obj) => {
      const editorObj: GWYFEditorObject = {
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

      if (obj.spawnName !== undefined) {
        editorObj.spawnName = obj.spawnName;
        editorObj.par = obj.par ?? 99;
      }

      return editorObj;
    });

    const mapJson: GWYFMapJson = {
      levelName: state.levelName,
      description: state.description,
      publishedID: 0,
      music: state.music,
      skybox: state.skybox,
      editorObjectData,
    };

    return JSON.stringify(mapJson);
  }

  getInfo(): {
    name: string;
    theme: Theme;
    holeCount: number;
    currentHole: number;
    totalObjects: number;
    objectsByType: Record<string, number>;
    holesStatus: Array<{
      holeNumber: number;
      hasSpawn: boolean;
      hasHole: boolean;
      hasFlagpole: boolean;
      objectCount: number;
    }>;
  } {
    const state = this.getState();
    const objectsByType: Record<string, number> = {};
    for (const obj of state.objects) {
      objectsByType[obj.type] = (objectsByType[obj.type] || 0) + 1;
    }

    const holesStatus = [];
    for (let h = 1; h <= state.holeCount; h++) {
      const holeObjects = state.objects.filter((o) => o.holeNumber === h);
      holesStatus.push({
        holeNumber: h,
        hasSpawn: holeObjects.some((o) => o.type === 'spawn'),
        hasHole: holeObjects.some((o) => o.type === 'hole'),
        hasFlagpole: holeObjects.some((o) => o.type === 'flagpole'),
        objectCount: holeObjects.length,
      });
    }

    return {
      name: state.levelName,
      theme: state.theme,
      holeCount: state.holeCount,
      currentHole: state.currentHoleNumber,
      totalObjects: state.objects.length,
      objectsByType,
      holesStatus,
    };
  }
}
