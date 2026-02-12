'use client';

import { useCallback, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useDrawingStore } from '../state/drawing-store';
import { snapToGrid } from './tool-types';
import type { FurniturePreset } from '../catalog/furniture-presets';

const GROUND_NORMAL = new THREE.Vector3(0, 1, 0);
const GROUND_PLANE = new THREE.Plane(GROUND_NORMAL, 0);

interface FurnitureToolProps {
  isActive: boolean;
  selectedPreset: FurniturePreset | null;
}

export function FurnitureTool({ isActive, selectedPreset }: FurnitureToolProps) {
  const addObject = useDrawingStore((s) => s.addObject);
  const { camera, raycaster, pointer } = useThree();
  const intersectPoint = useRef(new THREE.Vector3());
  const previewRef = useRef<THREE.Mesh>(null);

  const getGroundPoint = useCallback(() => {
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.ray.intersectPlane(GROUND_PLANE, intersectPoint.current);
    if (!hit) return null;
    return { x: snapToGrid(hit.x), z: snapToGrid(hit.z) };
  }, [camera, raycaster, pointer]);

  const handlePointerDown = useCallback(() => {
    if (!isActive || !selectedPreset) return;
    const point = getGroundPoint();
    if (!point) return;

    addObject({
      id: crypto.randomUUID(),
      catalogId: selectedPreset.id,
      name: selectedPreset.name,
      position: { x: point.x, y: selectedPreset.dimensions.y / 2, z: point.z },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    });
  }, [isActive, selectedPreset, getGroundPoint, addObject]);

  const handlePointerMove = useCallback(() => {
    if (!isActive || !selectedPreset || !previewRef.current) return;
    const point = getGroundPoint();
    if (point) {
      previewRef.current.position.set(point.x, selectedPreset.dimensions.y / 2, point.z);
    }
  }, [isActive, selectedPreset, getGroundPoint]);

  if (!isActive || !selectedPreset) return null;

  const dims = selectedPreset.dimensions;

  return (
    <group onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}>
      {/* Invisible ground plane for raycasting */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial />
      </mesh>

      {/* Preview box at cursor */}
      <mesh ref={previewRef} position={[0, dims.y / 2, 0]}>
        <boxGeometry args={[dims.x, dims.y, dims.z]} />
        <meshStandardMaterial color={selectedPreset.color} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
