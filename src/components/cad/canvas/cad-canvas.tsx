'use client';

import { useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';
import { useDrawingStore } from '../state/drawing-store';
import { CameraController } from './camera-controller';
import { WallMesh } from '../objects/wall-mesh';
import { FurnitureMesh } from '../objects/furniture-mesh';
import { DimensionMesh } from '../objects/dimension-mesh';
import { RoomLabelMesh } from '../objects/room-label';
import { TextAnnotationMesh } from '../objects/text-annotation';
import { NorthArrow } from '../objects/north-arrow';
import { ScaleBar } from '../objects/scale-bar';
import { WallTool } from '../tools/wall-tool';
import { DoorTool } from '../tools/door-tool';
import { WindowTool } from '../tools/window-tool';
import { FurnitureTool } from '../tools/furniture-tool';
import { SelectTool } from '../tools/select-tool';
import { DimensionTool } from '../tools/dimension-tool';
import { LabelTool } from '../tools/label-tool';
import { TextTool } from '../tools/text-tool';

export function CadCanvas() {
  const walls = useDrawingStore((s) => s.walls);
  const objects = useDrawingStore((s) => s.objects);
  const dimensions = useDrawingStore((s) => s.dimensions);
  const roomLabels = useDrawingStore((s) => s.roomLabels);
  const textAnnotations = useDrawingStore((s) => s.textAnnotations);
  const activeTool = useDrawingStore((s) => s.activeTool);
  const selectedFurniturePreset = useDrawingStore((s) => s.selectedFurniturePreset);
  const selectObject = useDrawingStore((s) => s.selectObject);
  const orbitRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const cameraDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced camera persist (500ms)
  const handleOrbitChange = useCallback(() => {
    if (cameraDebounceRef.current) clearTimeout(cameraDebounceRef.current);
    cameraDebounceRef.current = setTimeout(() => {
      const controls = orbitRef.current;
      if (!controls) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctrl = controls as any;
      const cam = ctrl.object;
      const target = ctrl.target;
      if (cam && target) {
        useDrawingStore.getState().setCameraTransform(
          { x: cam.position.x, y: cam.position.y, z: cam.position.z },
          { x: target.x, y: target.y, z: target.z }
        );
      }
    }, 500);
  }, []);

  function handleCanvasPointerMissed() {
    if (activeTool === 'select') {
      selectObject(null);
    }
  }

  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [10, 8, 10], fov: 50 }}
        onPointerMissed={handleCanvasPointerMissed}
        gl={{ preserveDrawingBuffer: true }}
      >
        <CameraController />

        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {/* Grid */}
        <Grid
          cellSize={0.5}
          sectionSize={5}
          cellColor="#999999"
          sectionColor="#666666"
          fadeDistance={50}
          infiniteGrid
          position={[0, -0.01, 0]}
        />

        {/* Orbit controls */}
        <OrbitControls
          ref={orbitRef}
          makeDefault
          enableDamping={false}
          onChange={handleOrbitChange}
        />

        {/* Wall objects */}
        {walls.map((wall) => (
          <WallMesh key={wall.id} wall={wall} />
        ))}

        {/* Furniture objects */}
        {objects.map((obj) => (
          <FurnitureMesh key={obj.id} object={obj} />
        ))}

        {/* Dimension lines */}
        {dimensions.map((dim) => (
          <DimensionMesh key={dim.id} dimension={dim} />
        ))}

        {/* Room labels */}
        {roomLabels.map((label) => (
          <RoomLabelMesh key={label.id} label={label} />
        ))}

        {/* Text annotations */}
        {textAnnotations.map((annotation) => (
          <TextAnnotationMesh key={annotation.id} annotation={annotation} />
        ))}

        {/* HUD overlays */}
        <NorthArrow />
        <ScaleBar />

        {/* Tools */}
        <WallTool isActive={activeTool === 'wall'} />
        <DoorTool isActive={activeTool === 'door'} />
        <WindowTool isActive={activeTool === 'window'} />
        <FurnitureTool isActive={activeTool === 'furniture'} selectedPreset={selectedFurniturePreset} />
        <SelectTool isActive={activeTool === 'select'} orbitRef={orbitRef} />
        <DimensionTool isActive={activeTool === 'measure'} />
        <LabelTool isActive={activeTool === 'label'} />
        <TextTool isActive={activeTool === 'text'} />
      </Canvas>
    </div>
  );
}
