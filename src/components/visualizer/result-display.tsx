'use client';

/**
 * Result Display
 * Complete visualization results with comparison and actions
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BeforeAfterSlider } from './before-after-slider';
import { ConceptThumbnails } from './concept-thumbnails';
import { SaveVisualizationModal } from './save-visualization-modal';
import { DownloadButton } from './download-button';
import { EmailCaptureModal } from './email-capture-modal';
import type { VisualizationResponse } from '@/lib/schemas/visualization';
import {
  Share2,
  MessageSquare,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ResultDisplayProps {
  visualization: VisualizationResponse;
  originalImage: string;
  onStartOver: () => void;
  onGetQuote: () => void;
  className?: string;
}

export function ResultDisplay({
  visualization,
  originalImage,
  onStartOver,
  onGetQuote,
  className,
}: ResultDisplayProps) {
  const [selectedConceptIndex, setSelectedConceptIndex] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [emailCaptureOpen, setEmailCaptureOpen] = useState(false);
  const [hasProvidedEmail, setHasProvidedEmail] = useState(false);

  const selectedConcept = visualization.concepts[selectedConceptIndex];

  // Format generation time
  const formatTime = (ms: number): string => {
    const seconds = Math.round(ms / 1000);
    return `${seconds}s`;
  };

  // Format style name for display
  const formatStyle = (style: string): string => {
    return style.charAt(0).toUpperCase() + style.slice(1);
  };

  // Format room type for display
  const formatRoomType = (roomType: string): string => {
    return roomType.replace(/_/g, ' ');
  };

  // Handle pre-download email capture
  const handleBeforeDownload = async (): Promise<boolean> => {
    // If user already provided email, allow download
    if (hasProvidedEmail) {
      return true;
    }

    // Show email capture modal
    setEmailCaptureOpen(true);
    return false;
  };

  // Handle email submission
  const handleEmailSubmitted = () => {
    setHasProvidedEmail(true);
    setEmailCaptureOpen(false);
  };

  return (
    <div className={cn('space-y-6', className)} data-testid="visualization-result">
      {/* Success header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <Sparkles className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">Your Vision is Ready!</h2>
        <p className="text-muted-foreground mt-1">
          We&apos;ve reimagined your {formatRoomType(visualization.roomType)} in{' '}
          {visualization.concepts.length} stunning {formatStyle(visualization.style)}{' '}
          concepts
        </p>
        <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Generated in {formatTime(visualization.generationTimeMs)}</span>
        </div>
      </div>

      {/* Before/After comparison */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Drag to compare before and after
        </h3>
        {selectedConcept && (
          <BeforeAfterSlider
            beforeImage={originalImage}
            afterImage={selectedConcept.imageUrl}
            beforeLabel="Current"
            afterLabel={`Concept ${selectedConceptIndex + 1}`}
          />
        )}
      </div>

      {/* Concept thumbnails */}
      {visualization.concepts.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Choose a concept
          </h3>
          <ConceptThumbnails
            concepts={visualization.concepts}
            selectedIndex={selectedConceptIndex}
            onSelect={setSelectedConceptIndex}
          />
        </div>
      )}

      {/* Selected concept description */}
      {selectedConcept?.description && (
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <p className="text-sm">{selectedConcept.description}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Primary CTA */}
        <Button
          size="lg"
          className="flex-1 min-h-[52px]"
          onClick={onGetQuote}
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          Get a Quote for This Design
        </Button>

        {/* Secondary actions */}
        <div className="flex gap-2">
          {selectedConcept && (
            <DownloadButton
              imageUrl={selectedConcept.imageUrl}
              roomType={visualization.roomType}
              style={visualization.style}
              conceptIndex={selectedConceptIndex}
              visualizationId={visualization.id}
              showLabel={false}
              onBeforeDownload={handleBeforeDownload}
              className="min-h-[52px]"
            />
          )}

          <Button
            variant="outline"
            size="lg"
            className="min-h-[52px]"
            onClick={() => setShareModalOpen(true)}
          >
            <Share2 className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </div>

      {/* Start over option */}
      <div className="text-center pt-4 border-t border-border">
        <Button variant="ghost" onClick={onStartOver}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Start Over with a Different Photo
        </Button>
      </div>

      {/* Attribution */}
      <p className="text-xs text-center text-muted-foreground">
        AI-generated visualization for concept purposes only. Actual renovations
        may vary based on site conditions and material availability.
      </p>

      {/* Share modal */}
      <SaveVisualizationModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        visualizationId={visualization.id}
      />

      {/* Email capture modal for download */}
      <EmailCaptureModal
        open={emailCaptureOpen}
        onOpenChange={setEmailCaptureOpen}
        visualizationId={visualization.id}
        onEmailSubmitted={handleEmailSubmitted}
      />
    </div>
  );
}
