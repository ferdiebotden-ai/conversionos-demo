'use client';

import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { RoomLabel as RoomLabelType } from '../state/drawing-types';
import { useDrawingStore } from '../state/drawing-store';

interface RoomLabelMeshProps {
  label: RoomLabelType;
}

export function RoomLabelMesh({ label }: RoomLabelMeshProps) {
  const activeTool = useDrawingStore((s) => s.activeTool);
  const selectedId = useDrawingStore((s) => s.selectedId);
  const selectObject = useDrawingStore((s) => s.selectObject);
  const units = useDrawingStore((s) => s.units);

  const isSelected = selectedId === label.id;

  function handleClick(e: ThreeEvent<MouseEvent>) {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    selectObject(label.id);
  }

  const areaText = label.showArea && label.manualArea != null
    ? units === 'imperial'
      ? `${(label.manualArea * 10.7639).toFixed(0)} sq ft`
      : `${label.manualArea.toFixed(1)} m\u00B2`
    : null;

  return (
    <group onClick={handleClick}>
      <Html position={[label.position.x, 0.05, label.position.z]} center>
        <div
          className={`text-center px-3 py-1.5 rounded pointer-events-auto cursor-pointer select-none ${
            isSelected
              ? 'bg-red-50 border-2 border-red-400'
              : 'bg-white/80 border border-gray-300'
          }`}
        >
          <div className="text-sm font-semibold text-gray-800">{label.name}</div>
          {areaText && (
            <div className="text-xs text-gray-500">{areaText}</div>
          )}
        </div>
      </Html>
    </group>
  );
}
