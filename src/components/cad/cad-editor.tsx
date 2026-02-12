'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Toolbar from './panels/toolbar';
import EditorHeader from './panels/editor-header';
import StatusBar from './panels/status-bar';
import CatalogPanel from './panels/catalog-panel';
import { LayersPanel } from './panels/layers-panel';
import { PropertiesPanel } from './panels/properties-panel';
import { CadCanvas } from './canvas/cad-canvas';
import { useDrawingStore } from './state/drawing-store';
import { useKeyboardShortcuts } from './hooks/use-keyboard-shortcuts';
import { useDrawingAutosave } from './hooks/use-drawing-autosave';
import { deserializeDrawing, serializeDrawing } from './state/drawing-serializer';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CadEditorProps {
  drawingId: string;
  initialData?: unknown;
  drawingName?: string;
}

export default function CadEditor({ drawingId, initialData, drawingName }: CadEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'unsaved'>('idle');
  const [catalogOpen, setCatalogOpen] = useState(false);

  // Wire autosave
  const { isSaving: isAutosaving, lastSaved } = useDrawingAutosave(drawingId);

  // Merge autosave status with manual save status
  const effectiveSaveStatus = isAutosaving ? 'saving' : saveStatus;

  // Hydrate store from initial data on mount
  useEffect(() => {
    if (initialData) {
      const validated = deserializeDrawing(initialData);
      if (validated) {
        useDrawingStore.getState().loadDrawing({
          walls: validated.walls,
          openings: validated.openings,
          objects: validated.objects,
          dimensions: validated.dimensions,
          roomLabels: validated.roomLabels,
          textAnnotations: validated.textAnnotations,
          materialAssignments: validated.materialAssignments,
          layers: validated.layers,
          units: validated.units,
          cameraMode: validated.camera.mode,
          cameraPosition: validated.camera.position,
          cameraTarget: validated.camera.target,
        });
      }
    }
  }, [initialData]);

  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const state = useDrawingStore.getState();
      const drawingData = serializeDrawing({
        walls: state.walls,
        openings: state.openings,
        objects: state.objects,
        dimensions: state.dimensions,
        roomLabels: state.roomLabels,
        textAnnotations: state.textAnnotations,
        materialAssignments: state.materialAssignments,
        layers: state.layers,
        cameraMode: state.cameraMode,
        cameraPosition: state.cameraPosition,
        cameraTarget: state.cameraTarget,
        units: state.units,
      });

      const res = await fetch(`/api/drawings/${drawingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawing_data: drawingData }),
      });

      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('unsaved');
      }
    } catch {
      setSaveStatus('unsaved');
    }
  }, [drawingId]);

  useKeyboardShortcuts({ onSave: handleSave });

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-[600px] rounded-lg border bg-background overflow-hidden focus:outline-none"
      tabIndex={0}
    >
      {/* Left toolbar */}
      <Toolbar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        <EditorHeader onSave={handleSave} saveStatus={effectiveSaveStatus} lastSaved={lastSaved} drawingName={drawingName} />
        <div className="flex-1 relative">
          <CadCanvas />
        </div>
        <StatusBar />
      </div>

      {/* Right sidebar — Layers, Properties, Catalog */}
      <div className="flex flex-col w-56 bg-card border-l shrink-0">
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-4">
            <LayersPanel />
            <PropertiesPanel />
          </div>
        </ScrollArea>
        <div className="border-t">
          <CatalogPanel isOpen={catalogOpen} onToggle={() => setCatalogOpen(!catalogOpen)} />
        </div>
      </div>
    </div>
  );
}
