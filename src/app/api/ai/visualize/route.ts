/**
 * AI Visualization API Route
 * Generates AI design visualizations using Gemini
 * Enhanced with photo analysis and conversation context
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/db/server';
import {
  visualizationRequestSchema,
  type VisualizationResponse,
  type VisualizationError,
  type GeneratedConcept,
  type RoomType,
  type DesignStyle,
} from '@/lib/schemas/visualization';
import {
  generateVisualizationConcept,
  type VisualizationConfig,
} from '@/lib/ai/visualization';
import { VISUALIZATION_CONFIG, type GeneratedImage } from '@/lib/ai/gemini';
import {
  analyzeRoomPhotoForVisualization,
  type RoomAnalysis,
} from '@/lib/ai/photo-analyzer';
import type { DesignIntent } from '@/lib/schemas/visualizer-extraction';

// Extended request schema with optional photo analysis and design intent
const enhancedVisualizationRequestSchema = visualizationRequestSchema.extend({
  /** Skip photo analysis (for quick mode) */
  skipAnalysis: z.boolean().optional().default(false),
  /** Pre-analyzed photo data (from conversation mode) */
  photoAnalysis: z.record(z.string(), z.unknown()).optional(),
  /** Design intent from conversation */
  designIntent: z.object({
    desiredChanges: z.array(z.string()),
    constraintsToPreserve: z.array(z.string()),
    materialPreferences: z.array(z.string()).optional(),
  }).optional(),
  /** Conversation context for storage */
  conversationContext: z.record(z.string(), z.unknown()).optional(),
  /** Mode indicator */
  mode: z.enum(['quick', 'conversation']).optional().default('quick'),
});

// Maximum execution time for Vercel
export const maxDuration = 90;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = await request.json();

    // Validate request with enhanced schema
    const parseResult = enhancedVisualizationRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const error: VisualizationError = {
        error: 'Invalid request',
        code: 'INVALID_IMAGE',
        details: parseResult.error.issues[0]?.message,
      };
      return NextResponse.json(error, { status: 400 });
    }

    const {
      image,
      roomType,
      style,
      constraints,
      count,
      skipAnalysis,
      photoAnalysis: providedAnalysis,
      designIntent,
      conversationContext,
      mode,
    } = parseResult.data;

    // Initialize Supabase service client
    const supabase = createServiceClient();

    // Upload original image to Supabase Storage
    const originalImageUrl = await uploadOriginalImage(supabase, image);
    if (!originalImageUrl) {
      const error: VisualizationError = {
        error: 'Failed to store original image',
        code: 'STORAGE_ERROR',
      };
      return NextResponse.json(error, { status: 500 });
    }

    // Photo analysis - either use provided or perform new analysis
    let photoAnalysis: RoomAnalysis | undefined;

    if (providedAnalysis) {
      // Use pre-analyzed data from conversation mode
      photoAnalysis = providedAnalysis as RoomAnalysis;
    } else if (!skipAnalysis && process.env['OPENAI_API_KEY']) {
      // Perform photo analysis for enhanced prompts
      try {
        console.log('Analyzing photo for enhanced visualization...');
        const analysisStartTime = Date.now();
        photoAnalysis = await analyzeRoomPhotoForVisualization(image, roomType as RoomType);
        console.log(`Photo analysis completed in ${Date.now() - analysisStartTime}ms`);
      } catch (analysisError) {
        // Log but don't fail - we can generate without analysis
        console.warn('Photo analysis failed, proceeding without:', analysisError);
      }
    }

    // Generate visualization concepts
    let concepts: GeneratedConcept[];

    if (!process.env['GOOGLE_GENERATIVE_AI_API_KEY']) {
      // No API key - return clear error instead of silent placeholder fallback
      const error: VisualizationError = {
        error: 'Image generation service unavailable',
        code: 'GENERATION_FAILED',
        details: 'The visualization service is temporarily unavailable. Please try again later.',
      };
      return NextResponse.json(error, { status: 503 });
    }

    // Build visualization config with enhanced data
    const visualizationConfig: VisualizationConfig = {
      roomType: roomType as RoomType,
      style: style as DesignStyle,
      ...(constraints && { constraints }),
      ...(photoAnalysis && { photoAnalysis }),
      ...(designIntent && {
        designIntent: {
          desiredChanges: designIntent.desiredChanges,
          constraintsToPreserve: designIntent.constraintsToPreserve,
          ...(designIntent.materialPreferences && { materialPreferences: designIntent.materialPreferences }),
        },
      }),
      useEnhancedPrompts: true,
    };

    // Use real Gemini 3 Pro image generation with enhanced config
    concepts = await generateConceptsWithGeminiEnhanced(
      supabase,
      image,
      visualizationConfig,
      count
    );

    // Upload generated concepts to Supabase Storage (for real generated images)
    // For placeholders, we use external URLs directly

    const generationTimeMs = Date.now() - startTime;

    // Generate share token
    const shareToken = generateShareToken();

    // Save visualization to database with enhanced fields
    // Map 'exterior' to 'living_room' for DB compatibility (DB enum doesn't include exterior)
    const dbRoomType = roomType === 'exterior' ? 'living_room' : roomType;
    const { data: visualization, error: dbError } = await supabase
      .from('visualizations')
      .insert({
        original_photo_url: originalImageUrl,
        room_type: dbRoomType as 'kitchen' | 'bathroom' | 'living_room' | 'bedroom' | 'basement' | 'dining_room',
        style: style,
        constraints: constraints || null,
        generated_concepts: concepts,
        generation_time_ms: generationTimeMs,
        share_token: shareToken,
        source: mode === 'conversation' ? 'visualizer_conversation' : 'visualizer',
        device_type: getDeviceType(request),
        user_agent: request.headers.get('user-agent') || null,
        // Enhanced fields (will be ignored if columns don't exist yet)
        ...(photoAnalysis && { photo_analysis: photoAnalysis }),
        ...(conversationContext && { conversation_context: conversationContext }),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      const error: VisualizationError = {
        error: 'Failed to save visualization',
        code: 'STORAGE_ERROR',
        details: dbError.message,
      };
      return NextResponse.json(error, { status: 500 });
    }

    // Record metrics (fire and forget - don't block response)
    recordVisualizationMetrics(supabase, {
      visualizationId: visualization.id,
      generationTimeMs,
      conceptsRequested: count,
      conceptsGenerated: concepts.length,
      mode: mode || 'quick',
      photoAnalyzed: !!photoAnalysis,
      conversationTurns: (conversationContext as Record<string, unknown>)?.['turnCount'] as number || 0,
    }).catch((err) => console.error('Failed to record metrics:', err));

    // Build response
    const response: VisualizationResponse = {
      id: visualization.id,
      originalImageUrl,
      roomType,
      style,
      constraints: constraints || undefined,
      concepts,
      generationTimeMs,
      createdAt: visualization.created_at,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Visualization error:', error);

    // Check for timeout
    const elapsed = Date.now() - startTime;
    if (elapsed >= VISUALIZATION_CONFIG.timeout) {
      const errorResponse: VisualizationError = {
        error: 'Generation timed out',
        code: 'TIMEOUT',
        details: 'The AI took too long to generate visualizations. Please try again.',
      };
      return NextResponse.json(errorResponse, { status: 504 });
    }

    const errorResponse: VisualizationError = {
      error: 'Failed to generate visualization',
      code: 'UNKNOWN',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Upload original image to Supabase Storage
async function uploadOriginalImage(
  supabase: ReturnType<typeof createServiceClient>,
  imageBase64: string
): Promise<string | null> {
  try {
    // Extract base64 data and mime type
    const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      console.error('Invalid base64 image format');
      return null;
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const extension = mimeType?.split('/')[1] || 'jpg';

    // Decode base64 to buffer
    const buffer = Buffer.from(base64Data ?? '', 'base64');

    // Generate unique filename
    const filename = `original/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('visualizations')
      .upload(filename, buffer, {
        contentType: mimeType || 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      // Fall back to data URL if storage fails for any reason
      console.warn('Storage upload failed, using data URL as fallback');
      return imageBase64;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('visualizations')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Failed to upload image:', error);
    // Fall back to data URL if any exception occurs (e.g., invalid API key)
    console.warn('Storage exception occurred, using data URL as fallback');
    return imageBase64;
  }
}

// Upload generated image to Supabase Storage
async function uploadGeneratedImage(
  supabase: ReturnType<typeof createServiceClient>,
  image: GeneratedImage,
  index: number
): Promise<string | null> {
  try {
    const extension = image.mimeType.split('/')[1] || 'png';
    const filename = `generated/${Date.now()}-${index}-${Math.random().toString(36).slice(2)}.${extension}`;
    const buffer = Buffer.from(image.base64, 'base64');

    const { data, error } = await supabase.storage
      .from('visualizations')
      .upload(filename, buffer, {
        contentType: image.mimeType,
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      // Fall back to data URL for any storage error
      console.warn('Storage upload failed, using data URL as fallback');
      return `data:${image.mimeType};base64,${image.base64}`;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('visualizations')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Failed to upload generated image:', error);
    // Fall back to data URL if any exception occurs
    console.warn('Storage exception occurred, using data URL as fallback');
    return `data:${image.mimeType};base64,${image.base64}`;
  }
}

// Generate concepts using enhanced config (new approach)
async function generateConceptsWithGeminiEnhanced(
  supabase: ReturnType<typeof createServiceClient>,
  imageBase64: string,
  config: VisualizationConfig,
  count: number
): Promise<GeneratedConcept[]> {
  const concepts: GeneratedConcept[] = [];
  const errors: Error[] = [];

  // Generate concepts in parallel for speed
  const promises = Array.from({ length: count }, async (_, i) => {
    try {
      const result = await generateVisualizationConcept(
        imageBase64,
        config,
        undefined,
        undefined,
        i
      );

      if (result) {
        // Upload to Supabase Storage and get URL
        const imageUrl = await uploadGeneratedImage(supabase, result, i);
        if (imageUrl) {
          return {
            id: `concept-${i + 1}-${Date.now()}`,
            imageUrl,
            description: buildConceptDescription(config, i),
            generatedAt: new Date().toISOString(),
          };
        }
      }
      return null;
    } catch (error) {
      console.error(`Failed to generate concept ${i + 1}:`, error);
      if (error instanceof Error) {
        errors.push(error);
      }
      return null;
    }
  });

  const results = await Promise.allSettled(promises);

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      concepts.push(result.value);
    }
  }

  // If no concepts were generated, throw an error with details
  if (concepts.length === 0) {
    const firstError = errors[0];
    const errorMessage = firstError
      ? `Image generation failed: ${firstError.message}`
      : 'No visualization concepts could be generated. Please try again.';
    throw new Error(errorMessage);
  }

  // Log if we got fewer than requested
  if (concepts.length < count) {
    console.warn(`Only generated ${concepts.length}/${count} concepts`);
  }

  return concepts;
}

// Build a more descriptive concept description
function buildConceptDescription(config: VisualizationConfig, index: number): string {
  const { roomType, style, designIntent } = config;
  const styleName = style.charAt(0).toUpperCase() + style.slice(1);
  const roomName = roomType.replace('_', ' ');

  let description = `${styleName} ${roomName} design - Concept ${index + 1}`;

  // Add personalized details if design intent is available
  if (designIntent?.desiredChanges && designIntent.desiredChanges.length > 0) {
    const highlights = designIntent.desiredChanges.slice(0, 2);
    description += ` featuring ${highlights.join(' and ')}`;
  }

  return description;
}

// Legacy function for backwards compatibility
async function generateConceptsWithGemini(
  supabase: ReturnType<typeof createServiceClient>,
  imageBase64: string,
  roomType: RoomType,
  style: DesignStyle,
  constraints: string | undefined,
  count: number
): Promise<GeneratedConcept[]> {
  // Delegate to enhanced version with minimal config
  return generateConceptsWithGeminiEnhanced(
    supabase,
    imageBase64,
    {
      roomType,
      style,
      ...(constraints && { constraints }),
      useEnhancedPrompts: true,
    },
    count
  );
}

// Generate a unique share token
function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Detect device type from user agent
function getDeviceType(request: NextRequest): string {
  const ua = request.headers.get('user-agent') || '';
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

// Record visualization metrics
interface MetricsInput {
  visualizationId: string;
  generationTimeMs: number;
  conceptsRequested: number;
  conceptsGenerated: number;
  retryCount?: number;
  validationScore?: number;
  mode: 'quick' | 'conversation';
  photoAnalyzed: boolean;
  conversationTurns: number;
  errorOccurred?: boolean;
  errorCode?: string;
  errorMessage?: string;
}

async function recordVisualizationMetrics(
  supabase: ReturnType<typeof createServiceClient>,
  metrics: MetricsInput
): Promise<void> {
  // Estimate cost based on operations
  // Photo analysis: ~$0.01, 4 concepts: ~$0.32, validation: ~$0.01
  const analysisCost = metrics.photoAnalyzed ? 0.01 : 0;
  const generationCost = metrics.conceptsGenerated * 0.08; // ~$0.08 per concept
  const validationCost = metrics.validationScore !== undefined ? 0.01 : 0;
  const totalCost = analysisCost + generationCost + validationCost;

  // Insert metrics record (table may not exist until migration applied)
  // Using type assertion since visualization_metrics table is created by migration
  const metricsData = {
    visualization_id: metrics.visualizationId,
    generation_time_ms: metrics.generationTimeMs,
    retry_count: metrics.retryCount || 0,
    concepts_requested: metrics.conceptsRequested,
    concepts_generated: metrics.conceptsGenerated,
    structure_validation_score: metrics.validationScore,
    validation_passed: metrics.validationScore ? metrics.validationScore >= 0.7 : null,
    mode: metrics.mode,
    photo_analyzed: metrics.photoAnalyzed,
    conversation_turns: metrics.conversationTurns,
    estimated_cost_usd: totalCost,
    analysis_cost_usd: analysisCost,
    generation_cost_usd: generationCost,
    validation_cost_usd: validationCost,
    error_occurred: metrics.errorOccurred || false,
    error_code: metrics.errorCode,
    error_message: metrics.errorMessage,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)('visualization_metrics').insert(metricsData);

  if (error) {
    // Log but don't throw - metrics recording shouldn't block the response
    console.error('Failed to record visualization metrics:', error);
  }
}
