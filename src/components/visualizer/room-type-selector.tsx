'use client';

/**
 * Room Type Selector
 * Card-based selection for room type
 */

import { cn } from '@/lib/utils';
import {
  UtensilsCrossed,
  Bath,
  Sofa,
  Home,
  Bed,
  TreeDeciduous,
  Lamp,
  type LucideIcon,
} from 'lucide-react';

export type RoomType = 'kitchen' | 'bathroom' | 'living_room' | 'basement' | 'bedroom' | 'exterior' | 'dining_room';

interface RoomOption {
  id: RoomType;
  label: string;
  icon: LucideIcon;
  description: string;
}

const ROOM_OPTIONS: RoomOption[] = [
  {
    id: 'kitchen',
    label: 'Kitchen',
    icon: UtensilsCrossed,
    description: 'Cabinets, counters, and appliances',
  },
  {
    id: 'bathroom',
    label: 'Bathroom',
    icon: Bath,
    description: 'Vanity, shower, and fixtures',
  },
  {
    id: 'living_room',
    label: 'Living Room',
    icon: Sofa,
    description: 'Main living and family spaces',
  },
  {
    id: 'basement',
    label: 'Basement',
    icon: Home,
    description: 'Finished or unfinished lower level',
  },
  {
    id: 'bedroom',
    label: 'Bedroom',
    icon: Bed,
    description: 'Master or guest bedrooms',
  },
  {
    id: 'exterior',
    label: 'Exterior',
    icon: TreeDeciduous,
    description: 'Siding, decks, and outdoor spaces',
  },
  {
    id: 'dining_room',
    label: 'Dining Room',
    icon: Lamp,
    description: 'Formal or casual dining spaces',
  },
];

interface RoomTypeSelectorProps {
  value: RoomType | null;
  onChange: (value: RoomType) => void;
  className?: string;
}

export function RoomTypeSelector({
  value,
  onChange,
  className,
}: RoomTypeSelectorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-lg font-semibold">What room is this?</h3>
        <p className="text-sm text-muted-foreground">
          Select the type of room in your photo
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {ROOM_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                'flex flex-col items-center p-4 rounded-lg border-2 transition-all',
                'min-h-[120px] hover:border-primary/50 hover:bg-muted/50',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background'
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center mb-2',
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <span className="font-medium text-sm">{option.label}</span>
              <span className="text-xs text-muted-foreground text-center mt-1 line-clamp-2">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
