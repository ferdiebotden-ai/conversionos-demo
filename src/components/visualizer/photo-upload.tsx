'use client';

/**
 * Photo Upload
 * Drag & drop zone with preview and tips
 */

import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Image as ImageIcon,
  X,
  Camera,
  Lightbulb,
} from 'lucide-react';
import { compressImage, fileToBase64 } from '@/lib/utils/image';

interface PhotoUploadProps {
  value: string | null;
  onChange: (value: string | null, file: File | null) => void;
  className?: string;
}

export function PhotoUpload({ value, onChange, className }: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsProcessing(true);

      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error('Please upload an image file');
        }

        // Validate file size (max 20MB before compression)
        if (file.size > 20 * 1024 * 1024) {
          throw new Error('Image too large. Maximum size is 20MB.');
        }

        // Compress and convert
        const compressed = await compressImage(file);
        const base64 = await fileToBase64(compressed);

        onChange(base64, compressed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process image');
        onChange(null, null);
      } finally {
        setIsProcessing(false);
      }
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleRemove = useCallback(() => {
    onChange(null, null);
    setError(null);
  }, [onChange]);

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-lg font-semibold">Upload your photo</h3>
        <p className="text-sm text-muted-foreground">
          Add a photo of the room you want to reimagine
        </p>
      </div>

      {value ? (
        // Preview state
        <div className="relative rounded-xl overflow-hidden border-2 border-border">
          <img
            src={value}
            alt="Uploaded room"
            className="w-full aspect-video object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <span className="text-white text-sm font-medium">
              Photo uploaded
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleRemove}
              className="bg-white/90 hover:bg-white"
            >
              <X className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        // Upload state — hidden input + clickable zone (most reliable pattern)
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isProcessing}
            aria-label="Upload room photo"
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'group rounded-xl border-2 border-dashed cursor-pointer transition-colors',
              'flex flex-col items-center justify-center py-12 px-6',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50 active:border-primary active:bg-primary/5 active:ring-2 active:ring-primary/30',
              isProcessing && 'opacity-50 pointer-events-none'
            )}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors bg-muted group-active:bg-primary/20">
              {isProcessing ? (
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-8 h-8 transition-colors text-muted-foreground group-active:text-primary" />
              )}
            </div>

            <p className="text-center">
              <span className="font-medium">
                {isProcessing ? 'Processing...' : 'Drop your image here'}
              </span>
              <br />
              <span className="text-sm text-muted-foreground">
                or click to browse
              </span>
            </p>

            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                JPG, PNG
              </span>
              <span className="flex items-center gap-1">
                <Camera className="w-3 h-3" />
                Max 20MB
              </span>
            </div>
          </div>
        </>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Tips section */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-sm">Tips for best results</p>
            <ul className="text-sm text-muted-foreground mt-1 space-y-1">
              <li>Take a wide shot from a corner of the room</li>
              <li>Ensure good lighting (natural light works best)</li>
              <li>Clear clutter for cleaner visualizations</li>
              <li>Include key features you want to transform</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
