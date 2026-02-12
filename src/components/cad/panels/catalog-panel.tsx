'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDrawingStore } from '../state/drawing-store';
import {
  getFurnitureByCategory,
  type FurnitureCategory,
} from '../catalog/furniture-presets';

interface CatalogPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const CATEGORIES: { id: FurnitureCategory; label: string }[] = [
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'bathroom', label: 'Bath' },
  { id: 'living', label: 'Living' },
  { id: 'bedroom', label: 'Bed' },
];

export default function CatalogPanel({ isOpen, onToggle }: CatalogPanelProps) {
  const selectedPreset = useDrawingStore((s) => s.selectedFurniturePreset);
  const setFurniturePreset = useDrawingStore((s) => s.setFurniturePreset);
  const setTool = useDrawingStore((s) => s.setTool);

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center justify-start pt-2 w-8 bg-card border-l shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggle}
          aria-label="Open furniture catalog"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-64 bg-card border-l shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-medium">Furniture Catalog</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onToggle}
          aria-label="Close catalog"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Category tabs */}
      <Tabs defaultValue="kitchen" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-2 mt-2 grid grid-cols-4">
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((cat) => {
          const items = getFurnitureByCategory(cat.id);
          return (
            <TabsContent key={cat.id} value={cat.id} className="flex-1 mt-0 min-h-0">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-1 p-2">
                  {items.map((item) => {
                    const isItemSelected = selectedPreset?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        className={`flex items-center gap-2 p-2 rounded-md text-left text-sm transition-colors ${
                          isItemSelected
                            ? 'bg-primary/10 border border-primary'
                            : 'hover:bg-muted border border-transparent'
                        }`}
                        onClick={() => {
                          setFurniturePreset(item);
                          setTool('furniture');
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded border shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.dimensions.x}m x {item.dimensions.z}m
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
