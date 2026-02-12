'use client';

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useDrawingStore } from '../state/drawing-store';

const ORTHO_VIEWS = {
  orthographic: {
    position: new THREE.Vector3(0, 20, 0.01),
    target: new THREE.Vector3(0, 0, 0),
  },
} as const;

export function CameraController() {
  const { camera } = useThree();
  const cameraMode = useDrawingStore((s) => s.cameraMode);
  const mountedRef = useRef(false);

  // On first mount, apply stored camera position for perspective mode
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const { cameraPosition, cameraTarget, cameraMode: mode } = useDrawingStore.getState();
    if (mode === 'perspective') {
      camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
      camera.lookAt(cameraTarget.x, cameraTarget.y, cameraTarget.z);
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  // When camera mode changes, apply the appropriate view
  useEffect(() => {
    if (cameraMode === 'orthographic') {
      const view = ORTHO_VIEWS.orthographic;
      camera.position.copy(view.position);
      camera.lookAt(view.target);
      camera.updateProjectionMatrix();
    } else {
      // Restore stored perspective camera
      const { cameraPosition, cameraTarget } = useDrawingStore.getState();
      camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
      camera.lookAt(cameraTarget.x, cameraTarget.y, cameraTarget.z);
      camera.updateProjectionMatrix();
    }
  }, [cameraMode, camera]);

  return null;
}
