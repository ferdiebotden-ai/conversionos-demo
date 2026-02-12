'use client';

import { useState } from 'react';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { Vec2 } from '../state/drawing-types';
import { useDrawingStore } from '../state/drawing-store';
import { snapVec2 } from './tool-types';

interface TextToolProps {
  isActive: boolean;
}

export function TextTool({ isActive }: TextToolProps) {
  const [pendingPoint, setPendingPoint] = useState<Vec2 | null>(null);
  const [textContent, setTextContent] = useState('');
  const addTextAnnotation = useDrawingStore((s) => s.addTextAnnotation);

  if (!isActive) {
    if (pendingPoint) {
      setPendingPoint(null);
      setTextContent('');
    }
    return null;
  }

  function handleClick(e: ThreeEvent<MouseEvent>) {
    if (pendingPoint) return;
    const pt = snapVec2({ x: e.point.x, z: e.point.z });
    setPendingPoint(pt);
    setTextContent('');
  }

  function handleConfirm() {
    if (!pendingPoint || !textContent.trim()) return;
    addTextAnnotation({
      id: crypto.randomUUID(),
      position: pendingPoint,
      text: textContent.trim(),
      fontSize: 0.3,
      hasLeader: false,
    });
    setPendingPoint(null);
    setTextContent('');
  }

  function handleCancel() {
    setPendingPoint(null);
    setTextContent('');
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

      {/* Input dialog */}
      {pendingPoint && (
        <Html position={[pendingPoint.x, 0.2, pendingPoint.z]} center>
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-[200px]">
            <div className="text-xs font-medium text-gray-500 mb-1">Text Annotation</div>
            <textarea
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleConfirm();
                }
                if (e.key === 'Escape') handleCancel();
              }}
              rows={2}
              autoFocus
              placeholder="Enter annotation..."
            />
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
