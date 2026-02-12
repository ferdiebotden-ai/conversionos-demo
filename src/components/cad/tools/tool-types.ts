import type { Vec2 } from '../state/drawing-types';

export function snapToGrid(value: number, gridSize: number = 0.1): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapVec2(point: Vec2, gridSize: number = 0.1): Vec2 {
  return {
    x: snapToGrid(point.x, gridSize),
    z: snapToGrid(point.z, gridSize),
  };
}

export function distance(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function midpoint(a: Vec2, b: Vec2): Vec2 {
  return {
    x: (a.x + b.x) / 2,
    z: (a.z + b.z) / 2,
  };
}
