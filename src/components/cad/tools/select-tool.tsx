'use client';

import { useEffect, useRef, useCallback } from 'react';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useDrawingStore } from '../state/drawing-store';
import { midpoint } from './tool-types';

interface SelectToolProps {
  isActive: boolean;
  orbitRef: React.RefObject<
    { enabled: boolean } | null
  >;
}

export function SelectTool({ isActive, orbitRef }: SelectToolProps) {
  const walls = useDrawingStore((s) => s.walls);
  const objects = useDrawingStore((s) => s.objects);
  const selectedId = useDrawingStore((s) => s.selectedId);
  const selectObject = useDrawingStore((s) => s.selectObject);
  const updateWall = useDrawingStore((s) => s.updateWall);
  const updateObject = useDrawingStore((s) => s.updateObject);
  const deleteSelected = useDrawingStore((s) => s.deleteSelected);
  const transformRef = useRef<THREE.Group>(null);

  const selectedWall = walls.find((w) => w.id === selectedId);
  const selectedObject = objects.find((o) => o.id === selectedId);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isActive) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          deleteSelected();
        }
      }
      if (e.key === 'Escape') {
        selectObject(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, selectedId, deleteSelected, selectObject]);

  const handleWallTransformChange = useCallback(() => {
    if (!transformRef.current || !selectedWall) return;
    const pos = transformRef.current.position;

    const mid = midpoint(selectedWall.start, selectedWall.end);
    const dx = pos.x - mid.x;
    const dz = pos.z - mid.z;

    updateWall(selectedWall.id, {
      start: {
        x: selectedWall.start.x + dx,
        z: selectedWall.start.z + dz,
      },
      end: {
        x: selectedWall.end.x + dx,
        z: selectedWall.end.z + dz,
      },
    });
  }, [selectedWall, updateWall]);

  const handleObjectTransformChange = useCallback(() => {
    if (!transformRef.current || !selectedObject) return;
    const pos = transformRef.current.position;

    updateObject(selectedObject.id, {
      position: {
        x: pos.x,
        y: selectedObject.position.y,
        z: pos.z,
      },
    });
  }, [selectedObject, updateObject]);

  if (!isActive) return null;

  // Wall selected — TransformControls at wall midpoint
  if (selectedWall) {
    const mid = midpoint(selectedWall.start, selectedWall.end);
    return (
      <TransformControls
        position={[mid.x, selectedWall.height / 2, mid.z]}
        mode="translate"
        translationSnap={0.1}
        showY={false}
        onMouseDown={() => {
          if (orbitRef.current) orbitRef.current.enabled = false;
        }}
        onMouseUp={() => {
          if (orbitRef.current) orbitRef.current.enabled = true;
          handleWallTransformChange();
        }}
      >
        <group ref={transformRef} />
      </TransformControls>
    );
  }

  // Furniture object selected — TransformControls at object position
  if (selectedObject) {
    return (
      <TransformControls
        position={[selectedObject.position.x, selectedObject.position.y, selectedObject.position.z]}
        mode="translate"
        translationSnap={0.1}
        showY={false}
        onMouseDown={() => {
          if (orbitRef.current) orbitRef.current.enabled = false;
        }}
        onMouseUp={() => {
          if (orbitRef.current) orbitRef.current.enabled = true;
          handleObjectTransformChange();
        }}
      >
        <group ref={transformRef} />
      </TransformControls>
    );
  }

  // Opening selected — no TransformControls (bound to wall)
  // Nothing to render for select tool in this case
  return null;
}
