'use client';

import { useState, useCallback, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vec2 } from '../state/drawing-types';
import { useDrawingStore } from '../state/drawing-store';
import { distance } from './tool-types';

const WINDOW_WIDTH = 1.2;
const WINDOW_HEIGHT = 1.2;
const WINDOW_SILL = 0.9;

interface WindowToolProps {
  isActive: boolean;
}

type HoverState = {
  wallId: string;
  position: number;
  worldPos: Vec2;
  angle: number;
  wallHeight: number;
  valid: boolean;
};

export function WindowTool({ isActive }: WindowToolProps) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const walls = useDrawingStore((s) => s.walls);
  const openings = useDrawingStore((s) => s.openings);
  const addOpening = useDrawingStore((s) => s.addOpening);
  const { camera, raycaster, pointer, scene } = useThree();

  const wallData = useMemo(() => {
    return walls.map((wall) => {
      const len = distance(wall.start, wall.end);
      const dx = wall.end.x - wall.start.x;
      const dz = wall.end.z - wall.start.z;
      const angle = Math.atan2(dz, dx);
      return { wall, len, dx, dz, angle };
    });
  }, [walls]);

  const findWallHit = useCallback((): HoverState | null => {
    raycaster.setFromCamera(pointer, camera);

    const wallMeshes: THREE.Mesh[] = [];
    scene.traverse((obj) => {
      if (
        obj instanceof THREE.Mesh &&
        obj.geometry instanceof THREE.BoxGeometry &&
        obj.userData?.['type'] !== 'ground'
      ) {
        wallMeshes.push(obj);
      }
    });

    const intersects = raycaster.intersectObjects(wallMeshes, false);
    const hit = intersects[0];
    if (!hit) return null;

    const hitPoint = hit.point;

    let bestWall = wallData[0];
    let bestDist = Infinity;
    for (const wd of wallData) {
      const midX = (wd.wall.start.x + wd.wall.end.x) / 2;
      const midZ = (wd.wall.start.z + wd.wall.end.z) / 2;
      const d = Math.sqrt(
        (hitPoint.x - midX) ** 2 + (hitPoint.z - midZ) ** 2
      );
      if (d < bestDist) {
        bestDist = d;
        bestWall = wd;
      }
    }

    if (!bestWall) return null;

    const { wall, len } = bestWall;
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.z - wall.start.z;
    const px = hitPoint.x - wall.start.x;
    const pz = hitPoint.z - wall.start.z;
    const t = Math.max(0, Math.min(1, (px * dx + pz * dz) / (len * len)));

    const halfFrac = WINDOW_WIDTH / len / 2;
    const clampedT = Math.max(halfFrac, Math.min(1 - halfFrac, t));

    const worldX = wall.start.x + dx * clampedT;
    const worldZ = wall.start.z + dz * clampedT;

    const wallOpenings = openings.filter((o) => o.wallId === wall.id);
    const newStart = clampedT - halfFrac;
    const newEnd = clampedT + halfFrac;
    let valid = true;
    for (const existing of wallOpenings) {
      const existHalfFrac = existing.width / len / 2;
      const existStart = existing.position - existHalfFrac;
      const existEnd = existing.position + existHalfFrac;
      if (newStart < existEnd && newEnd > existStart) {
        valid = false;
        break;
      }
    }

    return {
      wallId: wall.id,
      position: clampedT,
      worldPos: { x: worldX, z: worldZ },
      angle: bestWall.angle,
      wallHeight: wall.height,
      valid,
    };
  }, [raycaster, pointer, camera, scene, wallData, openings]);

  const handlePointerMove = useCallback(() => {
    if (!isActive) return;
    setHover(findWallHit());
  }, [isActive, findWallHit]);

  const handlePointerDown = useCallback(() => {
    if (!isActive || !hover || !hover.valid) return;
    addOpening({
      id: crypto.randomUUID(),
      wallId: hover.wallId,
      type: 'window',
      position: hover.position,
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT,
      sillHeight: WINDOW_SILL,
    });
    setHover(null);
  }, [isActive, hover, addOpening]);

  if (!isActive) return null;

  return (
    <group onPointerMove={handlePointerMove} onPointerDown={handlePointerDown}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial />
      </mesh>

      {hover && (
        <mesh
          position={[
            hover.worldPos.x,
            WINDOW_SILL + WINDOW_HEIGHT / 2,
            hover.worldPos.z,
          ]}
          rotation={[0, -hover.angle, 0]}
        >
          <boxGeometry args={[WINDOW_WIDTH, WINDOW_HEIGHT, 0.08]} />
          <meshStandardMaterial
            color={hover.valid ? '#87CEEB' : '#999999'}
            transparent
            opacity={0.4}
          />
        </mesh>
      )}
    </group>
  );
}
