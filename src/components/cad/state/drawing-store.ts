'use client';

import { create } from 'zustand';
import type {
  Wall,
  Opening,
  PlacedObject,
  Dimension,
  RoomLabel,
  TextAnnotation,
  MaterialAssignment,
  LayerState,
  ToolType,
  Vec3,
} from './drawing-types';
import type { FurniturePreset } from '../catalog/furniture-presets';
import {
  createHistoryState,
  pushHistory as pushHistoryFn,
  popUndo,
  popRedo,
  canUndo,
  canRedo,
  type HistoryState,
} from './history-manager';

type DrawingState = {
  // Data
  walls: Wall[];
  openings: Opening[];
  objects: PlacedObject[];
  dimensions: Dimension[];
  roomLabels: RoomLabel[];
  textAnnotations: TextAnnotation[];
  materialAssignments: MaterialAssignment[];
  layers: LayerState[];

  // UI state
  selectedId: string | null;
  activeTool: ToolType;
  selectedFurniturePreset: FurniturePreset | null;
  cameraMode: 'perspective' | 'orthographic';
  cameraPosition: Vec3;
  cameraTarget: Vec3;
  units: 'metric' | 'imperial';

  // History
  history: HistoryState;
};

type DrawingActions = {
  // Wall actions
  addWall: (wall: Wall) => void;
  updateWall: (id: string, updates: Partial<Omit<Wall, 'id'>>) => void;
  deleteWall: (id: string) => void;

  // Opening actions
  addOpening: (opening: Opening) => void;
  updateOpening: (id: string, updates: Partial<Omit<Opening, 'id'>>) => void;
  deleteOpening: (id: string) => void;

  // Object actions
  addObject: (obj: PlacedObject) => void;
  updateObject: (id: string, updates: Partial<Omit<PlacedObject, 'id'>>) => void;
  deleteObject: (id: string) => void;

  // Dimension actions
  addDimension: (dim: Dimension) => void;
  deleteDimension: (id: string) => void;

  // Room label actions
  addRoomLabel: (label: RoomLabel) => void;
  updateRoomLabel: (id: string, updates: Partial<Omit<RoomLabel, 'id'>>) => void;
  deleteRoomLabel: (id: string) => void;

  // Text annotation actions
  addTextAnnotation: (annotation: TextAnnotation) => void;
  updateTextAnnotation: (id: string, updates: Partial<Omit<TextAnnotation, 'id'>>) => void;
  deleteTextAnnotation: (id: string) => void;

  // Selection & tools
  selectObject: (id: string | null) => void;
  setTool: (tool: ToolType) => void;
  setFurniturePreset: (preset: FurniturePreset | null) => void;
  deleteSelected: () => void;

  // View
  setCameraMode: (mode: 'perspective' | 'orthographic') => void;
  setCameraTransform: (position: Vec3, target: Vec3) => void;
  setUnits: (units: 'metric' | 'imperial') => void;

  // Layers
  setLayerVisibility: (name: string, visible: boolean) => void;
  setLayerLocked: (name: string, locked: boolean) => void;
  addLayer: (name: string) => void;
  deleteLayer: (name: string) => void;

  // History
  undo: () => void;
  redo: () => void;

  // Load
  loadDrawing: (data: {
    walls: Wall[];
    openings: Opening[];
    objects: PlacedObject[];
    dimensions: Dimension[];
    roomLabels?: RoomLabel[];
    textAnnotations?: TextAnnotation[];
    materialAssignments: MaterialAssignment[];
    layers: LayerState[];
    units: 'metric' | 'imperial';
    cameraMode: 'perspective' | 'orthographic';
    cameraPosition?: Vec3;
    cameraTarget?: Vec3;
  }) => void;
};

function snapshotState(state: DrawingState): string {
  return JSON.stringify({
    walls: state.walls,
    openings: state.openings,
    objects: state.objects,
    dimensions: state.dimensions,
    roomLabels: state.roomLabels,
    textAnnotations: state.textAnnotations,
    materialAssignments: state.materialAssignments,
    layers: state.layers,
    units: state.units,
    cameraMode: state.cameraMode,
  });
}

function restoreSnapshot(snapshot: string): Partial<DrawingState> | null {
  try {
    return JSON.parse(snapshot);
  } catch {
    console.error('Failed to restore snapshot');
    return null;
  }
}

const DEFAULT_LAYERS: LayerState[] = [
  { name: 'Existing', visible: true, locked: false },
  { name: 'Demolition', visible: true, locked: false },
  { name: 'Proposed', visible: true, locked: false },
  { name: 'Dimensions', visible: true, locked: false },
  { name: 'Furniture', visible: true, locked: false },
];

export const useDrawingStore = create<DrawingState & DrawingActions>()(
  (set, get) => ({
    // Initial state
    walls: [],
    openings: [],
    objects: [],
    dimensions: [],
    roomLabels: [],
    textAnnotations: [],
    materialAssignments: [],
    layers: DEFAULT_LAYERS,
    selectedId: null,
    activeTool: 'select',
    selectedFurniturePreset: null,
    cameraMode: 'perspective',
    cameraPosition: { x: 10, y: 8, z: 10 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    units: 'metric',
    history: createHistoryState(),

    // Wall actions
    addWall: (wall) => {
      const state = get();
      const snap = snapshotState(state);
      set({
        walls: [...state.walls, wall],
        history: pushHistoryFn(state.history, snap),
      });
    },

    updateWall: (id, updates) => {
      const state = get();
      const snap = snapshotState(state);
      set({
        walls: state.walls.map((w) =>
          w.id === id ? { ...w, ...updates } : w
        ),
        history: pushHistoryFn(state.history, snap),
      });
    },

    deleteWall: (id) => {
      const state = get();
      const snap = snapshotState(state);
      set({
        walls: state.walls.filter((w) => w.id !== id),
        openings: state.openings.filter((o) => o.wallId !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
        history: pushHistoryFn(state.history, snap),
      });
    },

    // Opening actions
    addOpening: (opening) => {
      const state = get();
      const snap = snapshotState(state);
      set({
        openings: [...state.openings, opening],
        history: pushHistoryFn(state.history, snap),
      });
    },

    updateOpening: (id, updates) => {
      const state = get();
      const snap = snapshotState(state);
      set({
        openings: state.openings.map((o) =>
          o.id === id ? { ...o, ...updates } : o
        ),
        history: pushHistoryFn(state.history, snap),
      });
    },

    deleteOpening: (id) => {
      const state = get();
      const snap = snapshotState(state);
      set({
        openings: state.openings.filter((o) => o.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
        history: pushHistoryFn(state.history, snap),
      });
    },

    // Object actions
    addObject: (obj) => {
      const state = get();
      const snap = snapshotState(state);
      set({
        objects: [...state.objects, obj],
        history: pushHistoryFn(state.history, snap),
      });
    },

    updateObject: (id, updates) => {
      const state = get();
      const snap = snapshotState(state);
      set({
        objects: state.objects.map((o) =>
          o.id === id ? { ...o, ...updates } : o
        ),
        history: pushHistoryFn(state.history, snap),
      });
    },

    deleteObject: (id) => {
      const state = get();
      const snap = snapshotState(state);
      set({
        objects: state.objects.filter((o) => o.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
        history: pushHistoryFn(state.history, snap),
      });
    },

    // Dimension actions
    addDimension: (dim) => {
      const state = get();
      const snap = snapshotState(state);
      set({
        dimensions: [...state.dimensions, dim],
        history: pushHistoryFn(state.history, snap),
      });
    },

    deleteDimension: (id) => {
      const state = get();
      const snap = snapshotState(state);
      set({
        dimensions: state.dimensions.filter((d) => d.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
        history: pushHistoryFn(state.history, snap),
      });
    },

    // Room label actions
    addRoomLabel: (label) => {
      const state = get();
      const snap = snapshotState(state);
      set({
        roomLabels: [...state.roomLabels, label],
        history: pushHistoryFn(state.history, snap),
      });
    },

    updateRoomLabel: (id, updates) => {
      const state = get();
      const snap = snapshotState(state);
      set({
        roomLabels: state.roomLabels.map((l) =>
          l.id === id ? { ...l, ...updates } : l
        ),
        history: pushHistoryFn(state.history, snap),
      });
    },

    deleteRoomLabel: (id) => {
      const state = get();
      const snap = snapshotState(state);
      set({
        roomLabels: state.roomLabels.filter((l) => l.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
        history: pushHistoryFn(state.history, snap),
      });
    },

    // Text annotation actions
    addTextAnnotation: (annotation) => {
      const state = get();
      const snap = snapshotState(state);
      set({
        textAnnotations: [...state.textAnnotations, annotation],
        history: pushHistoryFn(state.history, snap),
      });
    },

    updateTextAnnotation: (id, updates) => {
      const state = get();
      const snap = snapshotState(state);
      set({
        textAnnotations: state.textAnnotations.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
        history: pushHistoryFn(state.history, snap),
      });
    },

    deleteTextAnnotation: (id) => {
      const state = get();
      const snap = snapshotState(state);
      set({
        textAnnotations: state.textAnnotations.filter((a) => a.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
        history: pushHistoryFn(state.history, snap),
      });
    },

    // Selection & tools
    selectObject: (id) => set({ selectedId: id }),
    setTool: (tool) => set({ activeTool: tool, selectedId: null }),
    setFurniturePreset: (preset) => set({ selectedFurniturePreset: preset }),

    deleteSelected: () => {
      const state = get();
      const { selectedId } = state;
      if (!selectedId) return;

      if (state.walls.some((w) => w.id === selectedId)) {
        state.deleteWall(selectedId);
      } else if (state.openings.some((o) => o.id === selectedId)) {
        state.deleteOpening(selectedId);
      } else if (state.objects.some((o) => o.id === selectedId)) {
        state.deleteObject(selectedId);
      } else if (state.dimensions.some((d) => d.id === selectedId)) {
        state.deleteDimension(selectedId);
      } else if (state.roomLabels.some((l) => l.id === selectedId)) {
        state.deleteRoomLabel(selectedId);
      } else if (state.textAnnotations.some((a) => a.id === selectedId)) {
        state.deleteTextAnnotation(selectedId);
      }
    },

    // View
    setCameraMode: (mode) => set({ cameraMode: mode }),
    setCameraTransform: (position, target) => set({ cameraPosition: position, cameraTarget: target }),
    setUnits: (units) => set({ units }),

    // Layers
    setLayerVisibility: (name, visible) => {
      const state = get();
      set({
        layers: state.layers.map((l) =>
          l.name === name ? { ...l, visible } : l
        ),
      });
    },

    setLayerLocked: (name, locked) => {
      const state = get();
      set({
        layers: state.layers.map((l) =>
          l.name === name ? { ...l, locked } : l
        ),
      });
    },

    addLayer: (name) => {
      const state = get();
      if (state.layers.some((l) => l.name === name)) return;
      set({
        layers: [...state.layers, { name, visible: true, locked: false }],
      });
    },

    deleteLayer: (name) => {
      const state = get();
      if (state.layers.length <= 1) return;
      set({
        layers: state.layers.filter((l) => l.name !== name),
      });
    },

    // History
    undo: () => {
      const state = get();
      const currentSnap = snapshotState(state);
      const result = popUndo(state.history, currentSnap);
      if (!result) return;
      const restored = restoreSnapshot(result.snapshot);
      if (!restored) return;
      set({
        ...restored,
        history: result.history,
      });
    },

    redo: () => {
      const state = get();
      const currentSnap = snapshotState(state);
      const result = popRedo(state.history, currentSnap);
      if (!result) return;
      const restored = restoreSnapshot(result.snapshot);
      if (!restored) return;
      set({
        ...restored,
        history: result.history,
      });
    },

    // Load
    loadDrawing: (data) => {
      set({
        walls: data.walls,
        openings: data.openings,
        objects: data.objects,
        dimensions: data.dimensions,
        roomLabels: data.roomLabels ?? [],
        textAnnotations: data.textAnnotations ?? [],
        materialAssignments: data.materialAssignments,
        layers: data.layers,
        units: data.units,
        cameraMode: data.cameraMode,
        cameraPosition: data.cameraPosition ?? { x: 10, y: 8, z: 10 },
        cameraTarget: data.cameraTarget ?? { x: 0, y: 0, z: 0 },
        selectedId: null,
        activeTool: 'select',
        history: createHistoryState(),
      });
    },
  })
);

// Re-export helpers for external checks
export { canUndo, canRedo };
