'use client';

/**
 * Visualizer Form
 * Step-by-step form for AI design visualization
 * Supports two modes:
 * - Conversation Mode (default): AI chat for richer design intent capture
 * - Quick Mode: Traditional form flow for users in a hurry
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PhotoUpload } from './photo-upload';
import { RoomTypeSelector, type RoomType } from './room-type-selector';
import { StyleSelector, type DesignStyle } from './style-selector';
import { ResultDisplay } from './result-display';
import { GenerationLoading } from './generation-loading';
import { VisualizerChat } from './visualizer-chat';
import type {
  VisualizationResponse,
  VisualizationError,
} from '@/lib/schemas/visualization';
import type { RoomAnalysis } from '@/lib/ai/photo-analyzer';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Check,
  AlertCircle,
  MessageSquare,
  Zap,
} from 'lucide-react';

type Step = 'photo' | 'mode-select' | 'conversation' | 'room' | 'style' | 'constraints' | 'generating' | 'result' | 'error';
type VisualizerMode = 'conversation' | 'quick';

interface FormData {
  photo: string | null;
  photoFile: File | null;
  roomType: RoomType | null;
  style: DesignStyle | null;
  constraints: string;
  photoAnalysis?: RoomAnalysis;
  designIntent?: {
    desiredChanges: string[];
    constraintsToPreserve: string[];
    materialPreferences?: string[];
  };
}

// Quick mode steps
const QUICK_STEPS: { id: Step; label: string }[] = [
  { id: 'photo', label: 'Upload Photo' },
  { id: 'room', label: 'Room Type' },
  { id: 'style', label: 'Design Style' },
  { id: 'constraints', label: 'Preferences' },
];

// For backwards compatibility
const STEPS = QUICK_STEPS;

export function VisualizerForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('photo');
  const [mode, setMode] = useState<VisualizerMode>('conversation'); // Default to conversation mode
  const [formData, setFormData] = useState<FormData>({
    photo: null,
    photoFile: null,
    roomType: null,
    style: null,
    constraints: '',
  });
  const [visualization, setVisualization] = useState<VisualizationResponse | null>(null);
  const [error, setError] = useState<VisualizationError | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  const currentStepIndex = QUICK_STEPS.findIndex((s) => s.id === currentStep);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'photo':
        return !!formData.photo;
      case 'room':
        return !!formData.roomType;
      case 'style':
        return !!formData.style;
      case 'constraints':
        return true; // Constraints are optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 'photo') {
      // After photo upload, show mode selection
      setCurrentStep('mode-select');
    } else if (currentStep === 'mode-select') {
      if (mode === 'conversation') {
        setCurrentStep('conversation');
      } else {
        setCurrentStep('room');
      }
    } else if (currentStep === 'room') setCurrentStep('style');
    else if (currentStep === 'style') setCurrentStep('constraints');
    else if (currentStep === 'constraints') handleGenerate();
  };

  const handleBack = () => {
    if (currentStep === 'mode-select') setCurrentStep('photo');
    else if (currentStep === 'conversation') setCurrentStep('mode-select');
    else if (currentStep === 'room') setCurrentStep('mode-select');
    else if (currentStep === 'style') setCurrentStep('room');
    else if (currentStep === 'constraints') setCurrentStep('style');
    else if (currentStep === 'error') {
      // Return to appropriate step based on mode
      if (mode === 'conversation') {
        setCurrentStep('conversation');
      } else {
        setCurrentStep('constraints');
      }
    }
  };

  // Handle conversation mode generation
  const handleConversationGenerate = useCallback(
    async (config: {
      roomType: RoomType;
      style: DesignStyle;
      constraints?: string;
      photoAnalysis?: RoomAnalysis;
      designIntent?: {
        desiredChanges: string[];
        constraintsToPreserve: string[];
        materialPreferences?: string[];
      };
    }) => {
      // Update form data with conversation results
      // Use spread pattern for optional properties to satisfy exactOptionalPropertyTypes
      setFormData((prev) => {
        const updated: FormData = {
          ...prev,
          roomType: config.roomType,
          style: config.style,
          constraints: config.constraints || '',
        };
        if (config.photoAnalysis) {
          updated.photoAnalysis = config.photoAnalysis;
        }
        if (config.designIntent) {
          updated.designIntent = config.designIntent;
        }
        return updated;
      });

      // Proceed to generation
      setCurrentStep('generating');
      setGenerationProgress(0);
      setError(null);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev < 30) return prev + 5;
          if (prev < 60) return prev + 3;
          if (prev < 85) return prev + 1;
          return prev;
        });
      }, 500);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 100000);

        const response = await fetch('/api/ai/visualize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: formData.photo,
            roomType: config.roomType,
            style: config.style,
            constraints: config.constraints,
            count: 4,
            mode: 'conversation',
            photoAnalysis: config.photoAnalysis,
            designIntent: config.designIntent,
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
            details:
              'The visualization took too long. Please try again with a smaller image or simpler settings.',
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
    },
    [formData.photo]
  );

  const handleGenerate = useCallback(async () => {
    if (!formData.photo || !formData.roomType || !formData.style) return;

    setCurrentStep('generating');
    setGenerationProgress(0);
    setError(null);

    // Simulate progress updates while waiting
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        // Slow down as we approach 90%
        if (prev < 30) return prev + 5;
        if (prev < 60) return prev + 3;
        if (prev < 85) return prev + 1;
        return prev;
      });
    }, 500);

    try {
      // Create AbortController for timeout (100s to account for API processing)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 100000);

      const response = await fetch('/api/ai/visualize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: formData.photo,
          roomType: formData.roomType,
          style: formData.style,
          constraints: formData.constraints || undefined,
          count: 4,
          mode: 'quick',
          skipAnalysis: false, // Enable photo analysis for better prompts
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

      // Brief delay to show 100% before transitioning
      setTimeout(() => {
        setCurrentStep('result');
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);

      // Check if this is a timeout error
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
  }, [formData]);


  const handleStartOver = () => {
    setFormData({
      photo: null,
      photoFile: null,
      roomType: null,
      style: null,
      constraints: '',
    });
    setVisualization(null);
    setError(null);
    setCurrentStep('photo');
  };

  const handleGetQuote = () => {
    // Navigate to estimate page with visualization context
    const params = new URLSearchParams();
    if (visualization?.id) {
      params.set('visualization', visualization.id);
    }
    router.push(`/estimate?${params.toString()}`);
  };

  const handleRetry = () => {
    handleGenerate();
  };

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
          <Button variant="outline" onClick={handleBack}>
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

  // Generating state with enhanced loading
  if (currentStep === 'generating') {
    return (
      <div data-testid="generation-loading">
        <GenerationLoading
          style={formData.style || 'modern'}
          roomType={formData.roomType || 'kitchen'}
          progress={generationProgress}
          onCancel={handleStartOver}
        />
      </div>
    );
  }

  // Result state with before/after comparison
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

  // Conversation mode gets its own full-screen layout
  if (currentStep === 'conversation' && formData.photo) {
    return (
      <div className="h-[600px] max-h-[80vh] border border-border rounded-lg overflow-hidden">
        <VisualizerChat
          imageBase64={formData.photo}
          onGenerate={handleConversationGenerate}
          onBack={() => setCurrentStep('mode-select')}
        />
      </div>
    );
  }

  // Mode selection screen
  if (currentStep === 'mode-select' && formData.photo) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">How would you like to proceed?</h2>
          <p className="text-muted-foreground mt-2">
            Choose your preferred way to describe your renovation vision
          </p>
        </div>

        {/* Photo thumbnail */}
        <div className="flex justify-center mb-8">
          <div className="relative w-48 h-36 rounded-lg overflow-hidden border border-border">
            <img
              src={formData.photo}
              alt="Your room"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-2 left-2 text-white text-xs font-medium">
              Your room
            </div>
          </div>
        </div>

        {/* Mode options */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Conversation Mode - Recommended */}
          <button
            onClick={() => {
              setMode('conversation');
              setCurrentStep('conversation');
            }}
            className={cn(
              'p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg',
              'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-primary/10">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Chat with AI</h3>
                <span className="text-xs text-primary font-medium">Recommended</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Have a quick conversation about your design vision. Our AI will understand your preferences and generate personalized results.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-500" />
                Better understanding of your vision
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-500" />
                Personalized recommendations
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-500" />
                Higher quality results
              </li>
            </ul>
          </button>

          {/* Quick Mode */}
          <button
            onClick={() => {
              setMode('quick');
              setCurrentStep('room');
            }}
            className={cn(
              'p-6 rounded-xl border-2 text-left transition-all hover:shadow-md',
              'border-border hover:border-muted-foreground/50'
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-muted">
                <Zap className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Quick Form</h3>
                <span className="text-xs text-muted-foreground">Faster</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Skip the chat and use our simple form. Select room type, style, and we'll generate options.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <Zap className="w-3 h-3" />
                Quick 3-step process
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-3 h-3" />
                Choose from preset styles
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-3 h-3" />
                Optional preferences text
              </li>
            </ul>
          </button>
        </div>

        {/* Back button */}
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => setCurrentStep('photo')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Choose Different Photo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator - only show for quick mode */}
      {mode === 'quick' && currentStepIndex >= 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {QUICK_STEPS.length}
            </span>
            <span className="text-sm font-medium">
              {QUICK_STEPS[currentStepIndex]?.label}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${((currentStepIndex + 1) / QUICK_STEPS.length) * 100}%`,
              }}
            />
          </div>

          {/* Step dots */}
          <div className="flex justify-between mt-3">
            {QUICK_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-2',
                  index <= currentStepIndex
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                    index < currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : index === currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {index < currentStepIndex ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs hidden sm:inline">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form steps */}
      <div className="mb-8">
        {currentStep === 'photo' && (
          <PhotoUpload
            value={formData.photo}
            onChange={(photo, file) =>
              setFormData((prev) => ({ ...prev, photo, photoFile: file }))
            }
          />
        )}

        {currentStep === 'room' && (
          <RoomTypeSelector
            value={formData.roomType}
            onChange={(roomType) =>
              setFormData((prev) => ({ ...prev, roomType }))
            }
          />
        )}

        {currentStep === 'style' && (
          <StyleSelector
            value={formData.style}
            onChange={(style) => setFormData((prev) => ({ ...prev, style }))}
          />
        )}

        {currentStep === 'constraints' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="constraints" className="text-lg font-semibold">
                What would you like to change? (Optional)
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Be specific about what to keep or change for best results
              </p>
            </div>

            <Textarea
              id="constraints"
              value={formData.constraints}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  constraints: e.target.value,
                }))
              }
              placeholder={`Examples:
• Keep my existing cabinets
• Add more storage
• Make it brighter
• Change the flooring only
• I love marble countertops`}
              className="min-h-[180px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.constraints.length}/500 characters
            </p>

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border mt-6">
              <h4 className="font-medium text-sm mb-2">Your Selection</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Room:</span>{' '}
                  <span className="font-medium capitalize">
                    {formData.roomType?.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Style:</span>{' '}
                  <span className="font-medium capitalize">
                    {formData.style}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          disabled={!canProceed()}
          data-testid={currentStep === 'constraints' ? 'generate-button' : undefined}
        >
          {currentStep === 'constraints' ? (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Vision
            </>
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
