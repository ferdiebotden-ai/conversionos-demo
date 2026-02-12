'use client';

import { useRef, useMemo } from 'react';
import { Edges } from '@react-three/drei';
import type { Mesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { Wall, Opening } from '../state/drawing-types';
import { useDrawingStore } from '../state/drawing-store';
import { distance, midpoint } from '../tools/tool-types';
import { OpeningMesh } from './opening-mesh';

interface WallMeshProps {
  wall: Wall;
}

type WallSegment = {
  xOffset: number; // offset from wall center along wall axis
  yCenter: number; // vertical center of segment
  width: number; // length along wall
  height: number; // vertical height
};

export function WallMesh({ wall }: WallMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const activeTool = useDrawingStore((s) => s.activeTool);
  const selectedId = useDrawingStore((s) => s.selectedId);
  const selectObject = useDrawingStore((s) => s.selectObject);
  const openings = useDrawingStore((s) => s.openings);

  const isSelected = selectedId === wall.id;
  const len = distance(wall.start, wall.end);
  const mid = midpoint(wall.start, wall.end);
  const angle = Math.atan2(
    wall.end.z - wall.start.z,
    wall.end.x - wall.start.x
  );

  const wallOpenings = useMemo(
    () => openings.filter((o) => o.wallId === wall.id),
    [openings, wall.id]
  );

  // Compute wall segments when openings exist
  const segments = useMemo(() => {
    if (wallOpenings.length === 0) return null;

    const sorted = [...wallOpenings].sort((a, b) => a.position - b.position);
    const segs: WallSegment[] = [];

    // Walk left to right in wall-local coordinates (0 = start, len = end)
    // The group is centered at the wall midpoint, so x-offsets are relative to center (len/2)
    let cursor = 0; // in meters from wall start

    for (const op of sorted) {
      const opCenterM = op.position * len; // center of opening in meters
      const opHalfW = op.width / 2;
      const opStart = opCenterM - opHalfW;
      const opEnd = opCenterM + opHalfW;

      // Solid segment before this opening
      if (opStart > cursor) {
        const segWidth = opStart - cursor;
        const segCenter = cursor + segWidth / 2;
        segs.push({
          xOffset: segCenter - len / 2,
          yCenter: wall.height / 2,
          width: segWidth,
          height: wall.height,
        });
      }

      // Header above the opening (wall material from top of opening to ceiling)
      const openingTop = op.sillHeight + op.height;
      if (openingTop < wall.height) {
        const headerHeight = wall.height - openingTop;
        segs.push({
          xOffset: opCenterM - len / 2,
          yCenter: openingTop + headerHeight / 2,
          width: op.width,
          height: headerHeight,
        });
      }

      // Sill below the opening (for windows with sillHeight > 0)
      if (op.sillHeight > 0) {
        segs.push({
          xOffset: opCenterM - len / 2,
          yCenter: op.sillHeight / 2,
          width: op.width,
          height: op.sillHeight,
        });
      }

      cursor = opEnd;
    }

    // Remaining solid segment after last opening
    if (cursor < len) {
      const segWidth = len - cursor;
      const segCenter = cursor + segWidth / 2;
      segs.push({
        xOffset: segCenter - len / 2,
        yCenter: wall.height / 2,
        width: segWidth,
        height: wall.height,
      });
    }

    return segs;
  }, [wallOpenings, len, wall.height]);

  function handleClick(e: ThreeEvent<MouseEvent>) {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    selectObject(wall.id);
  }

  const materialColor = isSelected ? '#f5e6d0' : '#e8e0d8';
  const emissiveColor = isSelected ? '#443322' : '#000000';
  const emissiveIntensity = isSelected ? 0.15 : 0;
  const edgeColor = isSelected ? '#d4a574' : '#999999';

  // No openings: render single solid wall (original behavior)
  if (!segments) {
    return (
      <mesh
        ref={meshRef}
        position={[mid.x, wall.height / 2, mid.z]}
        rotation={[0, -angle, 0]}
        onClick={handleClick}
      >
        <boxGeometry args={[len, wall.height, wall.thickness]} />
        <meshStandardMaterial
          color={materialColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
        <Edges color={edgeColor} />
      </mesh>
    );
  }

  // With openings: render segmented wall + opening meshes
  return (
    <group
      position={[mid.x, 0, mid.z]}
      rotation={[0, -angle, 0]}
      onClick={handleClick}
    >
      {segments.map((seg, i) => (
        <mesh key={`seg-${i}`} position={[seg.xOffset, seg.yCenter, 0]}>
          <boxGeometry args={[seg.width, seg.height, wall.thickness]} />
          <meshStandardMaterial
            color={materialColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
          <Edges color={edgeColor} />
        </mesh>
      ))}

      {wallOpenings.map((op) => (
        <OpeningMesh
          key={op.id}
          opening={op}
          wallStart={wall.start}
          wallEnd={wall.end}
          wallHeight={wall.height}
          wallThickness={wall.thickness}
        />
      ))}
    </group>
  );
}
