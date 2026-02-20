'use client';

/**
 * Visualizer Form
 * Streamlined single-page form for AI design visualization
 * Flow: Upload Photo → Room Type → Style → Preferences (text + voice) → Generate → Results
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PhotoUpload } from './photo-upload';
import { RoomTypeSelector, type RoomType, type RoomTypeSelection } from './room-type-selector';
import { StyleSelector, type DesignStyle, type DesignStyleSelection } from './style-selector';
import { PreferencesSection } from './preferences-section';
import { FloatingGenerateButton } from './floating-generate-button';
import { PhotoSummaryBar } from './photo-summary-bar';
import { ResultDisplay } from './result-display';
import { GenerationLoading } from './generation-loading';
import { VoiceProvider, useVoice } from '@/components/voice/voice-provider';
import { serializeHandoffContext } from '@/lib/chat/handoff';
import { mergeDesignIntent, type DesignPreferences, type VoiceExtractedPreferences } from '@/lib/schemas/design-preferences';
import type {
  VisualizationResponse,
  VisualizationError,
} from '@/lib/schemas/visualization';
import type { RoomAnalysis } from '@/lib/ai/photo-analyzer';
import type { VoiceTranscriptEntry } from '@/lib/voice/config';
import {
  AlertCircle,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

type Step = 'photo' | 'form' | 'generating' | 'result' | 'error';

interface FormData {
  photo: string | null;
  photoFile: File | null;
  roomType: RoomTypeSelection | null;
  customRoomType: string;
  style: DesignStyleSelection | null;
  customStyle: string;
  textPreferences: string;
  voiceTranscript: VoiceTranscriptEntry[];
  voicePreferencesSummary?: string;
  voiceExtractedPreferences?: VoiceExtractedPreferences;
  photoAnalysis?: RoomAnalysis;
}

function VisualizerFormInner() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('photo');
  const [formData, setFormData] = useState<FormData>({
    photo: null,
    photoFile: null,
    roomType: null,
    customRoomType: '',
    style: null,
    customStyle: '',
    textPreferences: '',
    voiceTranscript: [],
  });
  const [visualization, setVisualization] = useState<VisualizationResponse | null>(null);
  const [error, setError] = useState<VisualizationError | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  // Refs for auto-scroll behavior
  const styleSectionRef = useRef<HTMLDivElement>(null);
  const preferencesSectionRef = useRef<HTMLDivElement>(null);

  // Sync voice transcript from VoiceProvider
  const { transcript: voiceTranscript, endVoice, status: voiceStatus } = useVoice();
  useEffect(() => {
    if (voiceTranscript.length > 0) {
      setFormData(prev => ({ ...prev, voiceTranscript }));
    }
  }, [voiceTranscript]);

  // Auto-scroll: room → style, style → preferences
  const handleRoomTypeChange = useCallback((value: RoomTypeSelection) => {
    setFormData(prev => ({ ...prev, roomType: value }));
    // Scroll to style section after a brief delay for the UI to update
    setTimeout(() => {
      styleSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }, []);

  const handleStyleChange = useCallback((value: DesignStyleSelection) => {
    setFormData(prev => ({ ...prev, style: value }));
    setTimeout(() => {
      preferencesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }, []);

  // Run photo analysis async after upload
  const runPhotoAnalysis = useCallback(async (imageBase64: string) => {
    if (!process.env['NEXT_PUBLIC_DEMO_MODE']) {
      setIsAnalyzingPhoto(true);
      try {
        // We don't need to call the analysis endpoint separately — it runs server-side
        // during the /api/ai/visualize call. But if we wanted pre-analysis for
        // room type detection, we could add it here. For now, just mark as done.
        setIsAnalyzingPhoto(false);
      } catch {
        setIsAnalyzingPhoto(false);
      }
    }
  }, []);

  const handlePhotoUpload = useCallback((photo: string | null, file: File | null) => {
    setFormData(prev => ({ ...prev, photo, photoFile: file }));
    if (photo) {
      setCurrentStep('form');
      runPhotoAnalysis(photo);
    }
  }, [runPhotoAnalysis]);

  const handleChangePhoto = useCallback(() => {
    setFormData(prev => {
      const { photoAnalysis: _, ...rest } = prev;
      return { ...rest, photo: null, photoFile: null };
    });
    setCurrentStep('photo');
  }, []);

  // Voice summary callback
  const handleVoiceSummaryReady = useCallback((summary: string, extracted: VoiceExtractedPreferences) => {
    setFormData(prev => ({
      ...prev,
      voicePreferencesSummary: summary,
      voiceExtractedPreferences: extracted,
    }));
  }, []);

  // Build design preferences and generate
  const handleGenerate = useCallback(async () => {
    if (!formData.photo || !formData.roomType || !formData.style) return;

    // End any active voice session — transcript is already captured
    if (voiceStatus === 'connected' || voiceStatus === 'connecting') {
      await endVoice();
    }

    setCurrentStep('generating');
    setGenerationProgress(0);
    setError(null);

    // Simulate progress — tuned for ~60-90s generation time
    // Slower increments to avoid stalling at a visible threshold
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev < 20) return prev + 2;       // 0→20% in ~5s (uploading + analysis)
        if (prev < 50) return prev + 1.5;     // 20→50% in ~10s (structural conditioning)
        if (prev < 75) return prev + 0.5;     // 50→75% in ~25s (generating concepts batch 1)
        if (prev < 92) return prev + 0.2;     // 75→92% in ~42s (generating concepts batch 2)
        if (prev < 97) return prev + 0.05;    // 92→97% in ~50s (uploading + saving)
        return prev;                           // stalls at 97%
      });
    }, 500);

    try {
      // Build full design preferences
      const prefs: DesignPreferences = {
        roomType: formData.roomType,
        customRoomType: formData.roomType === 'other' ? formData.customRoomType : undefined,
        style: formData.style,
        customStyle: formData.style === 'other' ? formData.customStyle : undefined,
        textPreferences: formData.textPreferences,
        voiceTranscript: formData.voiceTranscript.map(t => ({
          role: t.role,
          content: t.content,
          timestamp: t.timestamp,
        })),
        voicePreferencesSummary: formData.voicePreferencesSummary,
        voiceExtractedPreferences: formData.voiceExtractedPreferences,
        photoAnalysis: formData.photoAnalysis as Record<string, unknown> | undefined,
      };

      // Merge all preference sources into a unified design intent
      const designIntent = mergeDesignIntent(prefs);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 150000); // 150s — matches server maxDuration + headroom

      const response = await fetch('/api/ai/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: formData.photo,
          roomType: formData.roomType,
          style: formData.style,
          customRoomType: formData.customRoomType || undefined,
          customStyle: formData.customStyle || undefined,
          constraints: formData.textPreferences || undefined,
          count: 4,
          mode: 'streamlined',
          designIntent,
          voicePreferencesSummary: formData.voicePreferencesSummary,
          voiceTranscript: formData.voiceTranscript.length > 0
            ? formData.voiceTranscript.map(t => ({
                role: t.role,
                content: t.content,
                timestamp: t.timestamp,
              }))
            : undefined,
          photoAnalysis: formData.photoAnalysis,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData: VisualizationError = await response.json();
        setError(errorData);
        setCurrentStep('error');
        return;
      }

      const data: VisualizationResponse = await response.json();
      setVisualization(data);
      setGenerationProgress(100);

      setTimeout(() => {
        setCurrentStep('result');
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);

      if (err instanceof Error && err.name === 'AbortError') {
        setError({
          error: 'Generation timed out',
          code: 'TIMEOUT',
          details: 'The visualization took too long. Please try again with a smaller image or simpler settings.',
        });
      } else {
        setError({
          error: 'Failed to connect to visualization service',
          code: 'UNKNOWN',
          details: err instanceof Error ? err.message : 'Unknown error',
        });
      }
      setCurrentStep('error');
    }
  }, [formData, endVoice, voiceStatus]);

  const handleStartOver = useCallback(() => {
    setFormData({
      photo: null,
      photoFile: null,
      roomType: null,
      customRoomType: '',
      style: null,
      customStyle: '',
      textPreferences: '',
      voiceTranscript: [],
    });
    setVisualization(null);
    setError(null);
    setCurrentStep('photo');
  }, []);

  const handleGetQuote = useCallback(() => {
    // Serialize full context for Marcus handoff
    const messages = formData.voiceTranscript.map(t => ({
      role: t.role as 'user' | 'assistant',
      content: t.content,
    }));

    const roomLabel = formData.roomType === 'other'
      ? formData.customRoomType
      : formData.roomType?.replace(/_/g, ' ') || '';
    const styleLabel = formData.style === 'other'
      ? formData.customStyle
      : formData.style || '';

    serializeHandoffContext(
      'design-consultant',
      'quote-specialist',
      messages,
      undefined,
    );

    // Also store rich context in sessionStorage for the estimate page
    if (typeof window !== 'undefined') {
      try {
        const handoffData = {
          fromPersona: 'design-consultant' as const,
          toPersona: 'quote-specialist' as const,
          summary: `User designed a ${roomLabel} renovation in ${styleLabel} style.`,
          recentMessages: messages.slice(-6),
          designPreferences: {
            roomType: formData.roomType || '',
            customRoomType: formData.customRoomType,
            style: formData.style || '',
            customStyle: formData.customStyle,
            textPreferences: formData.textPreferences,
            voicePreferencesSummary: formData.voicePreferencesSummary,
          },
          visualizationData: visualization ? {
            id: visualization.id,
            concepts: visualization.concepts,
            originalImageUrl: visualization.originalImageUrl,
            roomType: visualization.roomType,
            style: visualization.style,
          } : undefined,
          timestamp: Date.now(),
        };
        sessionStorage.setItem('demo_handoff_context', JSON.stringify(handoffData));
      } catch {
        // sessionStorage might be unavailable
      }
    }

    const params = new URLSearchParams();
    if (visualization?.id) {
      params.set('visualization', visualization.id);
    }
    router.push(`/estimate?${params.toString()}`);
  }, [formData, visualization, router]);

  const handleRetry = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  // Determine if generate button should be visible
  const canGenerate = !!formData.roomType && !!formData.style;

  // Get effective room/style for display
  const effectiveRoomType = formData.roomType === 'other'
    ? formData.customRoomType || 'Custom'
    : formData.roomType?.replace(/_/g, ' ');
  const effectiveStyle = formData.style === 'other'
    ? formData.customStyle || 'Custom'
    : formData.style;

  // Error state
  if (currentStep === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-center">Generation Failed</h2>
        <p className="text-muted-foreground mt-2 text-center">
          {error?.error || 'Something went wrong while generating your visualization.'}
        </p>
        {error?.details && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {error.details}
          </p>
        )}
        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={() => setCurrentStep('form')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={handleRetry}>
            <Sparkles className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Generating state
  if (currentStep === 'generating') {
    return (
      <div data-testid="generation-loading">
        <GenerationLoading
          style={effectiveStyle || 'modern'}
          roomType={effectiveRoomType || 'kitchen'}
          progress={generationProgress}
          onCancel={handleStartOver}
        />
      </div>
    );
  }

  // Result state
  if (currentStep === 'result' && visualization && formData.photo) {
    return (
      <ResultDisplay
        visualization={visualization}
        originalImage={formData.photo}
        onStartOver={handleStartOver}
        onGetQuote={handleGetQuote}
      />
    );
  }

  // Photo upload state
  if (currentStep === 'photo') {
    return (
      <div className="max-w-2xl mx-auto">
        <PhotoUpload
          value={formData.photo}
          onChange={handlePhotoUpload}
        />
      </div>
    );
  }

  // Main form state — single scrollable page with all sections
  return (
    <div className="max-w-2xl mx-auto relative">
      {/* Sticky photo header */}
      <PhotoSummaryBar
        photoSrc={formData.photo!}
        detectedRoomType={formData.photoAnalysis?.roomType}
        onChangePhoto={handleChangePhoto}
      />

      {/* Room Type Section */}
      <section className="py-6">
        <RoomTypeSelector
          value={formData.roomType}
          onChange={handleRoomTypeChange}
          allowCustom
          customValue={formData.customRoomType}
          onCustomChange={(v) => setFormData(prev => ({ ...prev, customRoomType: v }))}
        />
      </section>

      {/* Style Section */}
      <section ref={styleSectionRef} className="py-6 border-t border-border">
        <StyleSelector
          value={formData.style}
          onChange={handleStyleChange}
          allowCustom
          customValue={formData.customStyle}
          onCustomChange={(v) => setFormData(prev => ({ ...prev, customStyle: v }))}
        />
      </section>

      {/* Preferences Section (text + voice) */}
      <section ref={preferencesSectionRef} className="py-6 border-t border-border">
        <PreferencesSection
          textValue={formData.textPreferences}
          onTextChange={(v) => setFormData(prev => ({ ...prev, textPreferences: v }))}
          voiceTranscript={formData.voiceTranscript}
          voiceSummary={formData.voicePreferencesSummary}
          onVoiceSummaryReady={handleVoiceSummaryReady}
        />
      </section>

      {/* Selection Summary */}
      {canGenerate && (
        <div className="bg-muted/50 rounded-lg p-4 border border-border mb-24">
          <h4 className="font-medium text-sm mb-2">Your Selection</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Room:</span>{' '}
              <span className="font-medium capitalize">{effectiveRoomType}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Style:</span>{' '}
              <span className="font-medium capitalize">{effectiveStyle}</span>
            </div>
          </div>
          {formData.textPreferences && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              &ldquo;{formData.textPreferences}&rdquo;
            </p>
          )}
          {formData.voicePreferencesSummary && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              Voice: &ldquo;{formData.voicePreferencesSummary}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Floating Generate Button */}
      <FloatingGenerateButton
        visible={canGenerate}
        onClick={handleGenerate}
        disabled={!canGenerate}
      />
    </div>
  );
}

/**
 * VisualizerForm — wraps inner component with VoiceProvider
 */
export function VisualizerForm() {
  return (
    <VoiceProvider>
      <VisualizerFormInner />
    </VoiceProvider>
  );
}
