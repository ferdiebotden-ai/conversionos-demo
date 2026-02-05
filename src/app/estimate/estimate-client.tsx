'use client';

/**
 * Estimate Page Client Component
 * Handles visualization context from query parameters
 */

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';
import type { Visualization } from '@/types/database';

export function EstimatePageClient() {
  const searchParams = useSearchParams();
  const visualizationId = searchParams.get('visualization');
  const [visualizationContext, setVisualizationContext] = useState<VisualizationContext | null>(null);
  const [isLoading, setIsLoading] = useState(!!visualizationId);

  useEffect(() => {
    if (visualizationId) {
      fetchVisualization(visualizationId);
    }
  }, [visualizationId]);

  const fetchVisualization = async (id: string) => {
    try {
      const response = await fetch(`/api/visualizations/${id}`);
      if (response.ok) {
        const data: Visualization = await response.json();
        setVisualizationContext({
          id: data.id,
          roomType: data.room_type,
          style: data.style,
          originalPhotoUrl: data.original_photo_url,
          constraints: data.constraints || undefined,
        });
      }
    } catch (err) {
      console.error('Failed to fetch visualization:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your design...</p>
        </div>
      </div>
    );
  }

  return (
    <ChatInterface
      visualizationContext={visualizationContext ?? undefined}
    />
  );
}

export interface VisualizationContext {
  id: string;
  roomType: string;
  style: string;
  originalPhotoUrl: string;
  constraints?: string | undefined;
}
