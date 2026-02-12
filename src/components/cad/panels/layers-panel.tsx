'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useDrawingStore } from '../state/drawing-store';

export function LayersPanel() {
  const layers = useDrawingStore((s) => s.layers);
  const setLayerVisibility = useDrawingStore((s) => s.setLayerVisibility);
  const setLayerLocked = useDrawingStore((s) => s.setLayerLocked);
  const addLayer = useDrawingStore((s) => s.addLayer);
  const deleteLayer = useDrawingStore((s) => s.deleteLayer);
  const [newLayerName, setNewLayerName] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  function handleAddLayer() {
    const name = newLayerName.trim();
    if (!name) return;
    addLayer(name);
    setNewLayerName('');
    setShowAddInput(false);
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Layers</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowAddInput(!showAddInput)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add layer</TooltipContent>
        </Tooltip>
      </div>

      {showAddInput && (
        <div className="flex gap-1 mb-2">
          <Input
            className="h-7 text-xs"
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddLayer();
              if (e.key === 'Escape') setShowAddInput(false);
            }}
            placeholder="Layer name"
            autoFocus
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs shrink-0"
            onClick={handleAddLayer}
          >
            Add
          </Button>
        </div>
      )}

      {layers.map((layer) => (
        <div
          key={layer.name}
          className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-muted/50 group"
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setLayerVisibility(layer.name, !layer.visible)}
          >
            {layer.visible ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setLayerLocked(layer.name, !layer.locked)}
          >
            {layer.locked ? (
              <Lock className="h-3.5 w-3.5 text-amber-600" />
            ) : (
              <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>

          <span className={`text-xs flex-1 truncate ${!layer.visible ? 'text-muted-foreground line-through' : ''}`}>
            {layer.name}
          </span>

          {layers.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
              onClick={() => deleteLayer(layer.name)}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
