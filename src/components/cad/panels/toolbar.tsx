'use client';

import { MousePointer2, Square, DoorOpen, Frame, Armchair, Ruler, Tag, Type, Undo2, Redo2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useDrawingStore, canUndo, canRedo } from '../state/drawing-store';
import type { ToolType } from '../state/drawing-types';

const tools: { id: ToolType; label: string; icon: React.ComponentType<{ className?: string }>; shortcut: string }[] = [
  { id: 'select', label: 'Select', icon: MousePointer2, shortcut: 'V' },
  { id: 'wall', label: 'Wall', icon: Square, shortcut: 'W' },
  { id: 'door', label: 'Door', icon: DoorOpen, shortcut: 'D' },
  { id: 'window', label: 'Window', icon: Frame, shortcut: 'N' },
  { id: 'furniture', label: 'Furniture', icon: Armchair, shortcut: 'F' },
  { id: 'measure', label: 'Dimension', icon: Ruler, shortcut: 'M' },
  { id: 'label', label: 'Room Label', icon: Tag, shortcut: 'L' },
  { id: 'text', label: 'Text', icon: Type, shortcut: 'T' },
];

export default function Toolbar() {
  const activeTool = useDrawingStore((s) => s.activeTool);
  const setTool = useDrawingStore((s) => s.setTool);
  const undo = useDrawingStore((s) => s.undo);
  const redo = useDrawingStore((s) => s.redo);
  const history = useDrawingStore((s) => s.history);
  const selectedId = useDrawingStore((s) => s.selectedId);
  const deleteSelected = useDrawingStore((s) => s.deleteSelected);

  return (
    <div className="flex flex-col items-center gap-1 p-1 w-12 bg-card border-r shrink-0">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;
        return (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                size="icon"
                className="h-10 w-10"
                onClick={() => setTool(tool.id)}
                aria-label={tool.label}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {tool.label} ({tool.shortcut})
            </TooltipContent>
          </Tooltip>
        );
      })}

      <div className="w-8 border-t my-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={undo}
            disabled={!canUndo(history)}
            aria-label="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Undo (Ctrl+Z)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={redo}
            disabled={!canRedo(history)}
            aria-label="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Redo (Ctrl+Shift+Z)</TooltipContent>
      </Tooltip>

      <div className="w-8 border-t my-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-destructive hover:text-destructive"
            onClick={deleteSelected}
            disabled={!selectedId}
            aria-label="Delete Selected"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Delete Selected (Del)</TooltipContent>
      </Tooltip>
    </div>
  );
}
