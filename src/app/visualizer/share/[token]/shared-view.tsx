'use client';

/**
 * Shared Visualization View
 * Client component for interactive before/after display of shared visualization
 */

import { useState } from 'react';
import { BeforeAfterSlider } from '@/components/visualizer/before-after-slider';
import { ConceptThumbnails } from '@/components/visualizer/concept-thumbnails';
import type { Visualization } from '@/types/database';
import type { GeneratedConcept } from '@/lib/schemas/visualization';

interface SharedVisualizationViewProps {
  visualization: Visualization;
}

export function SharedVisualizationView({
  visualization,
}: SharedVisualizationViewProps) {
  const [selectedConceptIndex, setSelectedConceptIndex] = useState(0);

  // Parse generated concepts from JSON
  const concepts = (visualization.generated_concepts as unknown as GeneratedConcept[]) || [];
  const selectedConcept = concepts[selectedConceptIndex];

  if (!selectedConcept || concepts.length === 0) {
    return (
      <div className="aspect-video rounded-xl bg-muted flex items-center justify-center border border-border">
        <p className="text-muted-foreground">No visualizations available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Before/After comparison */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          Drag the slider to compare before and after
        </p>
        <BeforeAfterSlider
          beforeImage={visualization.original_photo_url}
          afterImage={selectedConcept.imageUrl}
          beforeLabel="Original"
          afterLabel={`Concept ${selectedConceptIndex + 1}`}
        />
      </div>

      {/* Concept thumbnails */}
      {concepts.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-center text-muted-foreground">
            View all {concepts.length} design concepts
          </h3>
          <ConceptThumbnails
            concepts={concepts}
            selectedIndex={selectedConceptIndex}
            onSelect={setSelectedConceptIndex}
          />
        </div>
      )}

      {/* Concept description if available */}
      {selectedConcept.description && (
        <div className="bg-muted/50 rounded-lg p-4 border border-border text-center">
          <p className="text-sm">{selectedConcept.description}</p>
        </div>
      )}

      {/* User constraints if provided */}
      {visualization.constraints && (
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <h4 className="text-sm font-medium mb-1">Design Preferences</h4>
          <p className="text-sm text-muted-foreground">{visualization.constraints}</p>
        </div>
      )}
    </div>
  );
}
