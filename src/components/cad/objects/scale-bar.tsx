'use client';

import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useDrawingStore } from '../state/drawing-store';

export function ScaleBar() {
  const units = useDrawingStore((s) => s.units);
  const { camera } = useThree();

  // Approximate scale from camera distance
  const dist = camera.position.length();
  // At default distance (~16), 1 world unit = ~60px on screen
  // Scale bar should show round numbers
  const pixelsPerUnit = 900 / dist; // rough approximation
  const targetBarPx = 100;
  const targetUnits = targetBarPx / pixelsPerUnit;

  // Round to nice number
  const niceNumbers = [0.1, 0.25, 0.5, 1, 2, 3, 5, 10, 15, 20, 25, 50];
  const barUnits = niceNumbers.find((n) => n >= targetUnits) ?? 10;
  const barPx = Math.round(barUnits * pixelsPerUnit);

  const label = units === 'imperial'
    ? `${(barUnits * 3.28084).toFixed(barUnits < 1 ? 1 : 0)} ft`
    : `${barUnits} m`;

  return (
    <Html
      position={[0, 0, 0]}
      style={{ position: 'fixed', bottom: 40, left: 16, pointerEvents: 'none' }}
      zIndexRange={[100, 100]}
      calculatePosition={() => [0, 0]}
    >
      <div className="bg-white/90 border border-gray-300 rounded px-2 py-1 shadow-sm">
        <div
          className="border-l-2 border-r-2 border-b-2 border-gray-800 h-2 mb-0.5"
          style={{ width: `${Math.max(barPx, 40)}px` }}
        />
        <div className="text-[9px] text-center text-gray-600 font-mono">{label}</div>
      </div>
    </Html>
  );
}
