// CAD Drawing data model types

export type Vec2 = { x: number; z: number };

export type Vec3 = { x: number; y: number; z: number };

export type Wall = {
  id: string;
  start: Vec2;
  end: Vec2;
  height: number; // default 2.4m
  thickness: number; // default 0.15m
  layer?: string;
};

export type Opening = {
  id: string;
  wallId: string;
  type: 'door' | 'window';
  position: number; // 0-1 along wall length
  width: number;
  height: number;
  sillHeight: number;
  layer?: string;
};

export type PlacedObject = {
  id: string;
  catalogId: string;
  name: string;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  layer?: string;
};

export type Dimension = {
  id: string;
  start: Vec2;
  end: Vec2;
  offset: number;
  label?: string;
  layer?: string;
};

export type RoomLabel = {
  id: string;
  position: Vec2; // center of label in world coords
  name: string; // "Kitchen", "Master Bedroom"
  showArea: boolean; // whether to display calculated area
  manualArea?: number; // user override (sq ft or sq m)
};

export type TextAnnotation = {
  id: string;
  position: Vec2;
  text: string;
  fontSize: number; // default 0.3 (world units)
  hasLeader: boolean; // arrow pointing to element
  leaderTarget?: Vec2; // where the arrow points
};

export type MaterialAssignment = {
  id: string;
  targetId: string;
  targetFace: string;
  materialId: string;
};

export type LayerState = {
  name: string;
  visible: boolean;
  locked: boolean;
};

export type CameraState = {
  position: Vec3;
  target: Vec3;
  mode: 'perspective' | 'orthographic';
};

export type DrawingData = {
  version: 1;
  units: 'metric' | 'imperial';
  camera: CameraState;
  walls: Wall[];
  openings: Opening[];
  objects: PlacedObject[];
  dimensions: Dimension[];
  roomLabels: RoomLabel[];
  textAnnotations: TextAnnotation[];
  materialAssignments: MaterialAssignment[];
  layers: LayerState[];
};

export type ToolType =
  | 'select'
  | 'wall'
  | 'door'
  | 'window'
  | 'furniture'
  | 'measure'
  | 'label'
  | 'text';
