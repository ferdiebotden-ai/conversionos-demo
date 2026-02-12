'use client';

import { useDrawingStore } from '../state/drawing-store';
import { getFurniturePreset } from '../catalog/furniture-presets';

const TOOL_LABELS: Record<string, string> = {
  select: 'Select',
  wall: 'Wall',
  door: 'Door',
  window: 'Window',
  furniture: 'Furniture',
  measure: 'Dimension',
  label: 'Room Label',
  text: 'Text',
};

export default function StatusBar() {
  const activeTool = useDrawingStore((s) => s.activeTool);
  const selectedId = useDrawingStore((s) => s.selectedId);
  const walls = useDrawingStore((s) => s.walls);
  const openings = useDrawingStore((s) => s.openings);
  const objects = useDrawingStore((s) => s.objects);
  const dimensions = useDrawingStore((s) => s.dimensions);
  const roomLabels = useDrawingStore((s) => s.roomLabels);
  const textAnnotations = useDrawingStore((s) => s.textAnnotations);
  const units = useDrawingStore((s) => s.units);
  const cameraMode = useDrawingStore((s) => s.cameraMode);

  const selectedWall = selectedId ? walls.find((w) => w.id === selectedId) : null;
  const selectedOpening = selectedId ? openings.find((o) => o.id === selectedId) : null;
  const selectedObject = selectedId ? objects.find((o) => o.id === selectedId) : null;
  const selectedDimension = selectedId ? dimensions.find((d) => d.id === selectedId) : null;
  const selectedLabel = selectedId ? roomLabels.find((l) => l.id === selectedId) : null;
  const selectedText = selectedId ? textAnnotations.find((a) => a.id === selectedId) : null;

  const formatLength = (value: number) => {
    if (units === 'imperial') {
      const feet = value * 3.28084;
      return `${feet.toFixed(1)}ft`;
    }
    return `${value.toFixed(2)}m`;
  };

  function renderSelectedInfo() {
    if (selectedWall) {
      return (
        <span className="ml-auto">
          Wall &mdash;{' '}
          {formatLength(
            Math.sqrt(
              (selectedWall.end.x - selectedWall.start.x) ** 2 +
              (selectedWall.end.z - selectedWall.start.z) ** 2
            )
          )}{' '}
          long, {formatLength(selectedWall.height)} high
        </span>
      );
    }

    if (selectedOpening) {
      const typeLabel = selectedOpening.type === 'door' ? 'Door' : 'Window';
      return (
        <span className="ml-auto">
          {typeLabel} &mdash; {formatLength(selectedOpening.width)} wide, {formatLength(selectedOpening.height)} high
        </span>
      );
    }

    if (selectedObject) {
      const preset = getFurniturePreset(selectedObject.catalogId);
      const dims = preset?.dimensions;
      return (
        <span className="ml-auto">
          {selectedObject.name}
          {dims && <> &mdash; {formatLength(dims.x)} x {formatLength(dims.z)}</>}
        </span>
      );
    }

    if (selectedDimension) {
      const len = Math.sqrt(
        (selectedDimension.end.x - selectedDimension.start.x) ** 2 +
        (selectedDimension.end.z - selectedDimension.start.z) ** 2
      );
      return (
        <span className="ml-auto">
          Dimension &mdash; {formatLength(len)}
        </span>
      );
    }

    if (selectedLabel) {
      return (
        <span className="ml-auto">
          Room Label &mdash; {selectedLabel.name}
        </span>
      );
    }

    if (selectedText) {
      return (
        <span className="ml-auto">
          Text &mdash; &ldquo;{selectedText.text.slice(0, 30)}{selectedText.text.length > 30 ? '...' : ''}&rdquo;
        </span>
      );
    }

    const parts: string[] = [];
    parts.push(`${walls.length} wall${walls.length !== 1 ? 's' : ''}`);
    if (openings.length > 0) {
      parts.push(`${openings.length} opening${openings.length !== 1 ? 's' : ''}`);
    }
    if (objects.length > 0) {
      parts.push(`${objects.length} object${objects.length !== 1 ? 's' : ''}`);
    }
    if (dimensions.length > 0) {
      parts.push(`${dimensions.length} dim${dimensions.length !== 1 ? 's' : ''}`);
    }
    if (roomLabels.length > 0) {
      parts.push(`${roomLabels.length} label${roomLabels.length !== 1 ? 's' : ''}`);
    }
    return <span className="ml-auto">{parts.join(', ')}</span>;
  }

  return (
    <div className="flex items-center gap-4 px-3 py-1 bg-muted text-xs text-muted-foreground border-t shrink-0">
      <span className="font-medium">{TOOL_LABELS[activeTool] ?? activeTool}</span>

      <span>{cameraMode === 'orthographic' ? '2D' : '3D'}</span>

      <span>{units === 'metric' ? 'Metric' : 'Imperial'}</span>

      {renderSelectedInfo()}
    </div>
  );
}
