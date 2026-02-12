'use client';

import { useState, useCallback } from 'react';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { Vec2 } from '../state/drawing-types';
import { useDrawingStore } from '../state/drawing-store';
import { detectRoom } from '../lib/room-detection';
import { snapVec2 } from './tool-types';

interface LabelToolProps {
  isActive: boolean;
}

export function LabelTool({ isActive }: LabelToolProps) {
  const [pendingPoint, setPendingPoint] = useState<Vec2 | null>(null);
  const [pendingArea, setPendingArea] = useState<number | null>(null);
  const [labelName, setLabelName] = useState('');
  const addRoomLabel = useDrawingStore((s) => s.addRoomLabel);
  const walls = useDrawingStore((s) => s.walls);
  const roomLabels = useDrawingStore((s) => s.roomLabels);

  const getDefaultName = useCallback(() => {
    return `Room ${roomLabels.length + 1}`;
  }, [roomLabels.length]);

  if (!isActive) {
    if (pendingPoint) {
      setPendingPoint(null);
      setLabelName('');
      setPendingArea(null);
    }
    return null;
  }

  function handleClick(e: ThreeEvent<MouseEvent>) {
    if (pendingPoint) return; // already placing

    const pt = snapVec2({ x: e.point.x, z: e.point.z });

    // Try to detect room
    const room = detectRoom(walls, pt);
    setPendingPoint(pt);
    setPendingArea(room?.area ?? null);
    setLabelName(getDefaultName());
  }

  function handleConfirm() {
    if (!pendingPoint) return;
    addRoomLabel({
      id: crypto.randomUUID(),
      position: pendingPoint,
      name: labelName || getDefaultName(),
      showArea: pendingArea !== null,
      ...(pendingArea !== null ? { manualArea: pendingArea } : {}),
    });
    setPendingPoint(null);
    setLabelName('');
    setPendingArea(null);
  }

  function handleCancel() {
    setPendingPoint(null);
    setLabelName('');
    setPendingArea(null);
  }

  return (
    <>
      {/* Click plane */}
      {!pendingPoint && (
        <mesh
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={handleClick}
        >
          <planeGeometry args={[200, 200]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}

      {/* Input dialog at click point */}
      {pendingPoint && (
        <Html position={[pendingPoint.x, 0.2, pendingPoint.z]} center>
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-[200px]">
            <div className="text-xs font-medium text-gray-500 mb-1">Room Label</div>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-red-400"
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
                if (e.key === 'Escape') handleCancel();
              }}
              autoFocus
              placeholder="Kitchen"
            />
            {pendingArea != null && (
              <div className="text-xs text-gray-500 mb-2">
                Area: {pendingArea.toFixed(1)} m&sup2;
              </div>
            )}
            <div className="flex gap-1">
              <button
                className="flex-1 bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700"
                onClick={handleConfirm}
              >
                Add
              </button>
              <button
                className="flex-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-200"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </Html>
      )}
    </>
  );
}
