'use client';

import { useMemo } from 'react';
import { Line, Edges } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { Opening, Vec2 } from '../state/drawing-types';
import { useDrawingStore } from '../state/drawing-store';
import { distance } from '../tools/tool-types';

interface OpeningMeshProps {
  opening: Opening;
  wallStart: Vec2;
  wallEnd: Vec2;
  wallHeight: number;
  wallThickness: number;
}

const FRAME_THICKNESS = 0.05;
const DOOR_COLOR = '#8B6914';
const GLASS_COLOR = '#87CEEB';

export function OpeningMesh({
  opening,
  wallStart,
  wallEnd,
  wallHeight,
  wallThickness,
}: OpeningMeshProps) {
  const activeTool = useDrawingStore((s) => s.activeTool);
  const selectedId = useDrawingStore((s) => s.selectedId);
  const selectObject = useDrawingStore((s) => s.selectObject);

  const isSelected = selectedId === opening.id;

  // When rendered inside the wall group (centered at midpoint, rotated by -angle),
  // we compute the x-offset along the wall axis in local coordinates.
  const wallLen = distance(wallStart, wallEnd);
  const xOffset = opening.position * wallLen - wallLen / 2;

  function handleClick(e: ThreeEvent<MouseEvent>) {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    selectObject(opening.id);
  }

  // Generate swing arc points for doors
  const swingArcPoints = useMemo(() => {
    if (opening.type !== 'door') return null;
    const radius = opening.width;
    const segments = 24;
    const points: [number, number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * (Math.PI / 2);
      points.push([Math.cos(t) * radius, 0.01, Math.sin(t) * radius]);
    }
    return points;
  }, [opening.type, opening.width]);

  return (
    <group
      position={[xOffset, 0, 0]}
      onClick={handleClick}
    >
      {opening.type === 'door' ? (
        <DoorGeometry
          width={opening.width}
          height={opening.height}
          thickness={wallThickness}
          isSelected={isSelected}
          swingArcPoints={swingArcPoints}
        />
      ) : (
        <WindowGeometry
          width={opening.width}
          height={opening.height}
          sillHeight={opening.sillHeight}
          thickness={wallThickness}
          isSelected={isSelected}
        />
      )}
    </group>
  );
}

function DoorGeometry({
  width,
  height,
  thickness,
  isSelected,
  swingArcPoints,
}: {
  width: number;
  height: number;
  thickness: number;
  isSelected: boolean;
  swingArcPoints: [number, number, number][] | null;
}) {
  const emissive = isSelected ? '#443322' : '#000000';
  const emissiveIntensity = isSelected ? 0.2 : 0;
  const halfW = width / 2;

  return (
    <group>
      {/* Left jamb */}
      <mesh position={[-halfW, height / 2, 0]}>
        <boxGeometry args={[FRAME_THICKNESS, height, thickness]} />
        <meshStandardMaterial
          color="#6B5B3D"
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
        <Edges color={isSelected ? '#d4a574' : '#666666'} />
      </mesh>

      {/* Right jamb */}
      <mesh position={[halfW, height / 2, 0]}>
        <boxGeometry args={[FRAME_THICKNESS, height, thickness]} />
        <meshStandardMaterial
          color="#6B5B3D"
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
        <Edges color={isSelected ? '#d4a574' : '#666666'} />
      </mesh>

      {/* Header */}
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[width + FRAME_THICKNESS * 2, FRAME_THICKNESS, thickness]} />
        <meshStandardMaterial
          color="#6B5B3D"
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
        <Edges color={isSelected ? '#d4a574' : '#666666'} />
      </mesh>

      {/* Door panel */}
      <mesh position={[0, height / 2, thickness / 4]}>
        <boxGeometry args={[width - FRAME_THICKNESS, height - FRAME_THICKNESS, 0.04]} />
        <meshStandardMaterial
          color={DOOR_COLOR}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
        <Edges color={isSelected ? '#d4a574' : '#888888'} />
      </mesh>

      {/* Swing arc */}
      {swingArcPoints && (
        <Line
          points={swingArcPoints}
          color={isSelected ? '#d4a574' : '#999999'}
          lineWidth={1}
          dashed
          dashSize={0.1}
          gapSize={0.05}
        />
      )}
    </group>
  );
}

function WindowGeometry({
  width,
  height,
  sillHeight,
  thickness,
  isSelected,
}: {
  width: number;
  height: number;
  sillHeight: number;
  thickness: number;
  isSelected: boolean;
}) {
  const emissive = isSelected ? '#443322' : '#000000';
  const emissiveIntensity = isSelected ? 0.2 : 0;
  const halfW = width / 2;
  const centerY = sillHeight + height / 2;

  return (
    <group>
      {/* Left frame */}
      <mesh position={[-halfW, centerY, 0]}>
        <boxGeometry args={[FRAME_THICKNESS, height, thickness]} />
        <meshStandardMaterial
          color="#CCCCCC"
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
        <Edges color={isSelected ? '#d4a574' : '#666666'} />
      </mesh>

      {/* Right frame */}
      <mesh position={[halfW, centerY, 0]}>
        <boxGeometry args={[FRAME_THICKNESS, height, thickness]} />
        <meshStandardMaterial
          color="#CCCCCC"
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
        <Edges color={isSelected ? '#d4a574' : '#666666'} />
      </mesh>

      {/* Top frame */}
      <mesh position={[0, sillHeight + height, 0]}>
        <boxGeometry args={[width + FRAME_THICKNESS * 2, FRAME_THICKNESS, thickness]} />
        <meshStandardMaterial
          color="#CCCCCC"
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
        <Edges color={isSelected ? '#d4a574' : '#666666'} />
      </mesh>

      {/* Bottom frame (sill) */}
      <mesh position={[0, sillHeight, 0]}>
        <boxGeometry args={[width + FRAME_THICKNESS * 2, FRAME_THICKNESS, thickness + 0.02]} />
        <meshStandardMaterial
          color="#CCCCCC"
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
        <Edges color={isSelected ? '#d4a574' : '#666666'} />
      </mesh>

      {/* Glass pane */}
      <mesh position={[0, centerY, 0]}>
        <boxGeometry args={[width - FRAME_THICKNESS, height - FRAME_THICKNESS, 0.01]} />
        <meshStandardMaterial
          color={GLASS_COLOR}
          transparent
          opacity={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
    </group>
  );
}
