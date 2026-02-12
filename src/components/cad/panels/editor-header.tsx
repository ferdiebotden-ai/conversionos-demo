'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { ExportDialog } from './export-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useDrawingStore } from '../state/drawing-store';

type CameraMode = 'perspective' | 'orthographic';

const CAMERA_MODES: { id: CameraMode; label: string; shortcut: string }[] = [
  { id: 'orthographic', label: 'Top (2D)', shortcut: '1' },
  { id: 'perspective', label: '3D', shortcut: '2' },
];

function formatTimeAgo(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

interface EditorHeaderProps {
  onSave?: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'unsaved';
  lastSaved?: Date | null;
  drawingName?: string | undefined;
}

export default function EditorHeader({ onSave, saveStatus = 'idle', lastSaved, drawingName }: EditorHeaderProps) {
  const cameraMode = useDrawingStore((s) => s.cameraMode);
  const setCameraMode = useDrawingStore((s) => s.setCameraMode);
  const units = useDrawingStore((s) => s.units);
  const setUnits = useDrawingStore((s) => s.setUnits);

  // Update "Saved Xs ago" text every 10 seconds
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!lastSaved) return;
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, [lastSaved]);

  const statusLabel: Record<string, string> = {
    idle: '',
    saving: 'Saving...',
    saved: 'Saved',
    unsaved: 'Unsaved changes',
  };

  const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    idle: 'secondary',
    saving: 'secondary',
    saved: 'outline',
    unsaved: 'destructive',
  };

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-card border-b text-sm shrink-0">
      {/* Camera mode toggles */}
      <div className="flex items-center gap-1">
        {CAMERA_MODES.map((mode) => (
          <Tooltip key={mode.id}>
            <TooltipTrigger asChild>
              <Button
                variant={cameraMode === mode.id ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setCameraMode(mode.id)}
              >
                {mode.label}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {mode.label} ({mode.shortcut})
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Right side: units toggle, save status, save button */}
      <div className="flex items-center gap-2">
        {/* Units toggle */}
        <div className="flex items-center border rounded-md overflow-hidden">
          <Button
            variant={units === 'metric' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs rounded-none"
            onClick={() => setUnits('metric')}
          >
            Metric
          </Button>
          <Button
            variant={units === 'imperial' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs rounded-none"
            onClick={() => setUnits('imperial')}
          >
            Imperial
          </Button>
        </div>

        {/* Save status badge */}
        {saveStatus !== 'idle' && (
          <Badge variant={statusVariant[saveStatus]}>
            {statusLabel[saveStatus]}
          </Badge>
        )}

        {/* Last saved indicator */}
        {saveStatus === 'idle' && lastSaved && (
          <span className="text-xs text-muted-foreground">
            Saved {formatTimeAgo(lastSaved)}
          </span>
        )}

        {/* Export button */}
        <ExportDialog drawingName={drawingName} />

        {/* Save button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onSave}
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              Save
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Save (Ctrl+S)</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
