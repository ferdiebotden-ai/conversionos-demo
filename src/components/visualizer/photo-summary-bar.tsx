'use client';

/**
 * Photo Summary Bar
 * Compact sticky header showing the uploaded photo thumbnail,
 * detected room type, and a "Change photo" action during the form state
 */

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface PhotoSummaryBarProps {
  photoSrc: string;
  detectedRoomType?: string | undefined;
  onChangePhoto: () => void;
  className?: string;
}

export function PhotoSummaryBar({
  photoSrc,
  detectedRoomType,
  onChangePhoto,
  className,
}: PhotoSummaryBarProps) {
  // Format room type for display (e.g. "living_room" -> "Living Room")
  const roomTypeLabel = detectedRoomType
    ? detectedRoomType
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : undefined;

  return (
    <div
      className={cn(
        'sticky top-0 z-10',
        'flex items-center gap-3 px-4 py-2',
        'bg-background/80 backdrop-blur-sm border-b border-border',
        className
      )}
    >
      {/* Photo thumbnail */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border">
        <Image
          src={photoSrc}
          alt="Uploaded room photo"
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>

      {/* Room type badge + spacer */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {roomTypeLabel && (
          <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full truncate">
            {roomTypeLabel}
          </span>
        )}
      </div>

      {/* Change photo action */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onChangePhoto}
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <Camera className="h-4 w-4 mr-1.5" />
        Change photo
      </Button>
    </div>
  );
}
