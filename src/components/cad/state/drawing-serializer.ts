import { z } from 'zod';
import type { DrawingData, RoomLabel, TextAnnotation } from './drawing-types';

const Vec2Schema = z.object({ x: z.number(), z: z.number() });

const Vec3Schema = z.object({ x: z.number(), y: z.number(), z: z.number() });

const WallSchema = z.object({
  id: z.string(),
  start: Vec2Schema,
  end: Vec2Schema,
  height: z.number(),
  thickness: z.number(),
  layer: z.string().optional(),
});

const OpeningSchema = z.object({
  id: z.string(),
  wallId: z.string(),
  type: z.enum(['door', 'window']),
  position: z.number().min(0).max(1),
  width: z.number(),
  height: z.number(),
  sillHeight: z.number(),
  layer: z.string().optional(),
});

const PlacedObjectSchema = z.object({
  id: z.string(),
  catalogId: z.string(),
  name: z.string(),
  position: Vec3Schema,
  rotation: Vec3Schema,
  scale: Vec3Schema,
  layer: z.string().optional(),
});

const DimensionSchema = z.object({
  id: z.string(),
  start: Vec2Schema,
  end: Vec2Schema,
  offset: z.number(),
  label: z.string().optional(),
  layer: z.string().optional(),
});

const RoomLabelSchema = z.object({
  id: z.string(),
  position: Vec2Schema,
  name: z.string(),
  showArea: z.boolean(),
  manualArea: z.number().optional(),
});

const TextAnnotationSchema = z.object({
  id: z.string(),
  position: Vec2Schema,
  text: z.string(),
  fontSize: z.number(),
  hasLeader: z.boolean(),
  leaderTarget: Vec2Schema.optional(),
});

const MaterialAssignmentSchema = z.object({
  id: z.string(),
  targetId: z.string(),
  targetFace: z.string(),
  materialId: z.string(),
});

const LayerStateSchema = z.object({
  name: z.string(),
  visible: z.boolean(),
  locked: z.boolean(),
});

const CameraStateSchema = z.object({
  position: Vec3Schema,
  target: Vec3Schema,
  mode: z.enum(['perspective', 'orthographic']),
});

export const DrawingDataSchema = z.object({
  version: z.literal(1),
  units: z.enum(['metric', 'imperial']),
  camera: CameraStateSchema,
  walls: z.array(WallSchema),
  openings: z.array(OpeningSchema),
  objects: z.array(PlacedObjectSchema),
  dimensions: z.array(DimensionSchema),
  roomLabels: z.array(RoomLabelSchema).default([]),
  textAnnotations: z.array(TextAnnotationSchema).default([]),
  materialAssignments: z.array(MaterialAssignmentSchema),
  layers: z.array(LayerStateSchema),
});

export type DrawingStoreSnapshot = {
  walls: DrawingData['walls'];
  openings: DrawingData['openings'];
  objects: DrawingData['objects'];
  dimensions: DrawingData['dimensions'];
  roomLabels?: RoomLabel[];
  textAnnotations?: TextAnnotation[];
  materialAssignments: DrawingData['materialAssignments'];
  layers: DrawingData['layers'];
  cameraMode: DrawingData['camera']['mode'];
  cameraPosition?: DrawingData['camera']['position'];
  cameraTarget?: DrawingData['camera']['target'];
  units: DrawingData['units'];
};

export function serializeDrawing(snapshot: DrawingStoreSnapshot): DrawingData {
  return {
    version: 1,
    units: snapshot.units,
    camera: {
      position: snapshot.cameraPosition ?? { x: 10, y: 8, z: 10 },
      target: snapshot.cameraTarget ?? { x: 0, y: 0, z: 0 },
      mode: snapshot.cameraMode,
    },
    walls: snapshot.walls,
    openings: snapshot.openings,
    objects: snapshot.objects,
    dimensions: snapshot.dimensions,
    roomLabels: snapshot.roomLabels ?? [],
    textAnnotations: snapshot.textAnnotations ?? [],
    materialAssignments: snapshot.materialAssignments,
    layers: snapshot.layers,
  };
}

export function deserializeDrawing(json: unknown): DrawingData | null {
  const result = DrawingDataSchema.safeParse(json);
  if (!result.success) {
    console.error('Drawing validation failed:', result.error.issues);
    return null;
  }
  return result.data as DrawingData;
}
