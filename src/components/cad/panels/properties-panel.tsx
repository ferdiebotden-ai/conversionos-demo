'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDrawingStore } from '../state/drawing-store';

export function PropertiesPanel() {
  const selectedId = useDrawingStore((s) => s.selectedId);
  const walls = useDrawingStore((s) => s.walls);
  const openings = useDrawingStore((s) => s.openings);
  const objects = useDrawingStore((s) => s.objects);
  const dimensions = useDrawingStore((s) => s.dimensions);
  const roomLabels = useDrawingStore((s) => s.roomLabels);
  const textAnnotations = useDrawingStore((s) => s.textAnnotations);
  const updateWall = useDrawingStore((s) => s.updateWall);
  const updateOpening = useDrawingStore((s) => s.updateOpening);
  const updateObject = useDrawingStore((s) => s.updateObject);
  const updateRoomLabel = useDrawingStore((s) => s.updateRoomLabel);
  const updateTextAnnotation = useDrawingStore((s) => s.updateTextAnnotation);

  if (!selectedId) return null;

  const wall = walls.find((w) => w.id === selectedId);
  const opening = openings.find((o) => o.id === selectedId);
  const obj = objects.find((o) => o.id === selectedId);
  const dimension = dimensions.find((d) => d.id === selectedId);
  const label = roomLabels.find((l) => l.id === selectedId);
  const text = textAnnotations.find((a) => a.id === selectedId);

  if (wall) {
    return (
      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Wall Properties</div>
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Height (m)</Label>
            <Input
              type="number"
              className="h-7 text-xs"
              value={wall.height}
              onChange={(e) => updateWall(wall.id, { height: parseFloat(e.target.value) || wall.height })}
              step={0.1}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Thickness (m)</Label>
            <Input
              type="number"
              className="h-7 text-xs"
              value={wall.thickness}
              onChange={(e) => updateWall(wall.id, { thickness: parseFloat(e.target.value) || wall.thickness })}
              step={0.01}
            />
          </div>
        </div>
      </div>
    );
  }

  if (opening) {
    return (
      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {opening.type === 'door' ? 'Door' : 'Window'} Properties
        </div>
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Width (m)</Label>
            <Input
              type="number"
              className="h-7 text-xs"
              value={opening.width}
              onChange={(e) => updateOpening(opening.id, { width: parseFloat(e.target.value) || opening.width })}
              step={0.1}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Height (m)</Label>
            <Input
              type="number"
              className="h-7 text-xs"
              value={opening.height}
              onChange={(e) => updateOpening(opening.id, { height: parseFloat(e.target.value) || opening.height })}
              step={0.1}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sill Height (m)</Label>
            <Input
              type="number"
              className="h-7 text-xs"
              value={opening.sillHeight}
              onChange={(e) => updateOpening(opening.id, { sillHeight: parseFloat(e.target.value) || 0 })}
              step={0.1}
            />
          </div>
        </div>
      </div>
    );
  }

  if (obj) {
    return (
      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Object Properties</div>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">{obj.name}</div>
          <div className="space-y-1">
            <Label className="text-xs">Rotation Y (deg)</Label>
            <Input
              type="number"
              className="h-7 text-xs"
              value={Math.round((obj.rotation.y * 180) / Math.PI)}
              onChange={(e) => {
                const deg = parseFloat(e.target.value) || 0;
                updateObject(obj.id, { rotation: { ...obj.rotation, y: (deg * Math.PI) / 180 } });
              }}
              step={15}
            />
          </div>
        </div>
      </div>
    );
  }

  if (dimension) {
    return (
      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dimension Properties</div>
        <div className="text-xs text-muted-foreground">
          {dimension.label ?? 'Auto-calculated'}
        </div>
      </div>
    );
  }

  if (label) {
    return (
      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Room Label</div>
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input
              className="h-7 text-xs"
              value={label.name}
              onChange={(e) => updateRoomLabel(label.id, { name: e.target.value })}
            />
          </div>
        </div>
      </div>
    );
  }

  if (text) {
    return (
      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Text Annotation</div>
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Text</Label>
            <Input
              className="h-7 text-xs"
              value={text.text}
              onChange={(e) => updateTextAnnotation(text.id, { text: e.target.value })}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
