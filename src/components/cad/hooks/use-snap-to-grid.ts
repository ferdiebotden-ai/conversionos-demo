'use client';

import type { Vec2 } from '../state/drawing-types';

const DEFAULT_GRID_SIZE = 0.1; // 0.1m increments

export function snapToGrid(
  value: number,
  gridSize: number = DEFAULT_GRID_SIZE
): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapVec2(vec: Vec2, gridSize: number = DEFAULT_GRID_SIZE): Vec2 {
  return {
    x: snapToGrid(vec.x, gridSize),
    z: snapToGrid(vec.z, gridSize),
  };
}
