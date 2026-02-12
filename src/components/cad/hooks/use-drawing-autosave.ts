'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDrawingStore } from '../state/drawing-store';
import { serializeDrawing } from '../state/drawing-serializer';

const DEBOUNCE_MS = 2000;

/** Keys that represent drawing data (not UI state) */
function getDataFingerprint() {
  const s = useDrawingStore.getState();
  return JSON.stringify({
    walls: s.walls,
    openings: s.openings,
    objects: s.objects,
    dimensions: s.dimensions,
    roomLabels: s.roomLabels,
    textAnnotations: s.textAnnotations,
    materialAssignments: s.materialAssignments,
    layers: s.layers,
    units: s.units,
  });
}

export function useDrawingAutosave(drawingId: string | null) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const prevFingerprintRef = useRef<string>('');

  const save = useCallback(async () => {
    if (!drawingId) return;

    const state = useDrawingStore.getState();
    const data = serializeDrawing({
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

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSaving(true);
    try {
      await fetch(`/api/drawings/${drawingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawing_data: data }),
        signal: controller.signal,
      });
      setLastSaved(new Date());
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('Autosave failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [drawingId]);

  useEffect(() => {
    if (!drawingId) return;

    // Initialize fingerprint
    prevFingerprintRef.current = getDataFingerprint();

    const unsub = useDrawingStore.subscribe(() => {
      // Only trigger save when actual data changes (not UI state like selectedId, activeTool)
      const next = getDataFingerprint();
      if (next === prevFingerprintRef.current) return;
      prevFingerprintRef.current = next;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(save, DEBOUNCE_MS);
    });

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [drawingId, save]);

  return { isSaving, lastSaved };
}
