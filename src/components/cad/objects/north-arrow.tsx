'use client';

import { Html } from '@react-three/drei';

export function NorthArrow() {
  return (
    <Html
      position={[0, 0, 0]}
      style={{ position: 'fixed', top: 12, right: 12, pointerEvents: 'none' }}
      zIndexRange={[100, 100]}
      calculatePosition={() => [0, 0]}
    >
      <div className="flex flex-col items-center bg-white/90 border border-gray-300 rounded-lg px-2 py-1.5 shadow-sm">
        <span className="text-[10px] font-bold text-gray-700">N</span>
        <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
          <path d="M8 0L13 8H3L8 0Z" fill="#333" />
          <path d="M8 20L3 12H13L8 20Z" fill="#ccc" />
        </svg>
      </div>
    </Html>
  );
}
