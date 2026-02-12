/**
 * AI Visualization API Route
 * Generates AI design visualizations using Gemini
 * Enhanced with photo analysis and conversation context
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/db/server';
import { getSiteId, withSiteId } from '@/lib/db/site';
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
import { VISUALIZATION_CONFIG, type GeneratedImage, type ReferenceImage } from '@/lib/ai/gemini';
import { estimateDepth } from '@/lib/ai/depth-estimation';
import { extractEdges } from '@/lib/ai/edge-detection';
import { generateWithRefinement } from '@/lib/ai/iterative-generation';
import { AI_CONFIG } from '@/lib/ai/config';
import {
  analyzeRoomPhotoForVisualization,
  type RoomAnalysis,
} from '@/lib/ai/photo-analyzer';
import type { DesignIntent } from '@/lib/schemas/visualizer-extraction';

// Extended request schema with optional photo analysis and design intent
const enhancedVisualizationRequestSchema = visualizationRequestSchema
  .omit({ roomType: true, style: true })
  .extend({
    /** Room type — accepts standard types or 'other' for custom */
    roomType: z.union([
      z.enum(['kitchen', 'bathroom', 'living_room', 'bedroom', 'basement', 'dining_room', 'exterior']),
      z.literal('other'),
    ]),
    /** Custom room type description (when roomType === 'other') */
    customRoomType: z.string().max(100).optional(),
    /** Design style — accepts standard styles or 'other' for custom */
    style: z.union([
      z.enum(['modern', 'traditional', 'farmhouse', 'industrial', 'minimalist', 'contemporary']),
      z.literal('other'),
    ]),
    /** Custom style description (when style === 'other') */
    customStyle: z.string().max(100).optional(),
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
    /** Voice transcript from Mia consultation */
    voiceTranscript: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      timestamp: z.coerce.date(),
    })).optional(),
    /** AI-generated summary of voice preferences */
    voicePreferencesSummary: z.string().optional(),
    /** Conversation context for storage */
    conversationContext: z.record(z.string(), z.unknown()).optional(),
    /** Mode indicator */
    mode: z.enum(['quick', 'conversation', 'streamlined']).optional().default('quick'),
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
      customRoomType,
      customStyle,
      constraints,
      count,
      skipAnalysis,
      photoAnalysis: providedAnalysis,
      designIntent,
      voiceTranscript,
      voicePreferencesSummary,
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

    // Phase 2: Structural conditioning — run depth + edge extraction in parallel
    const referenceImages: ReferenceImage[] = [];
    let hasDepthMap = false;
    let hasEdgeMap = false;
    let depthRange: { min: number; max: number } | undefined;

    // Always include source image as first reference
    const sourceMimeType = image.match(/^data:([^;]+);/)?.[1] || 'image/jpeg';
    referenceImages.push({ base64: image, mimeType: sourceMimeType, role: 'source' });

    if (AI_CONFIG.pipeline.enableDepthEstimation || AI_CONFIG.pipeline.enableEdgeDetection) {
      const pipelineStartTime = Date.now();
      const pipelinePromises: Promise<unknown>[] = [];

      if (AI_CONFIG.pipeline.enableDepthEstimation) {
        pipelinePromises.push(
          estimateDepth(image).then(result => {
            if (result) {
              referenceImages.push({ base64: result.depthMapBase64, mimeType: result.mimeType, role: 'depth' });
              hasDepthMap = true;
              depthRange = { min: result.minDepth, max: result.maxDepth };
              console.log(`Depth estimation completed: ${result.minDepth.toFixed(1)}m - ${result.maxDepth.toFixed(1)}m`);
            }
          }).catch(err => console.warn('Depth estimation failed, continuing without:', err))
        );
      }

      if (AI_CONFIG.pipeline.enableEdgeDetection) {
        pipelinePromises.push(
          extractEdges(image).then(result => {
            if (result) {
              referenceImages.push({ base64: result.edgeMapBase64, mimeType: result.mimeType, role: 'edges' });
              hasEdgeMap = true;
              console.log('Edge detection completed');
            }
          }).catch(err => console.warn('Edge detection failed, continuing without:', err))
        );
      }

      await Promise.allSettled(pipelinePromises);
      console.log(`Structural conditioning pipeline completed in ${Date.now() - pipelineStartTime}ms`);
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
    // For custom room/style types, fall back to a reasonable default for type compatibility
    const effectiveRoomType: RoomType = roomType === 'other' ? 'living_room' : roomType as RoomType;
    const effectiveStyle: DesignStyle = style === 'other' ? 'contemporary' : style as DesignStyle;

    const visualizationConfig: VisualizationConfig = {
      roomType: effectiveRoomType,
      style: effectiveStyle,
      ...(constraints && { constraints }),
      ...(photoAnalysis && { photoAnalysis }),
      ...(designIntent && {
        designIntent: {
          desiredChanges: designIntent.desiredChanges,
          constraintsToPreserve: designIntent.constraintsToPreserve,
          ...(designIntent.materialPreferences && { materialPreferences: designIntent.materialPreferences }),
        },
      }),
      // Pass custom types and voice data for prompt builder
      ...(roomType === 'other' && customRoomType && { customRoomType }),
      ...(style === 'other' && customStyle && { customStyle }),
      ...(voicePreferencesSummary && { voicePreferencesSummary }),
      useEnhancedPrompts: true,
      referenceImages: referenceImages.length > 1 ? referenceImages : undefined,
      hasDepthMap,
      hasEdgeMap,
      ...(depthRange && { depthRange }),
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
    // Map 'exterior'/'other' to 'living_room' for DB compatibility (DB enum doesn't include them)
    const dbRoomType = (roomType === 'exterior' || roomType === 'other') ? 'living_room' : roomType;
    // Map 'other' style to 'contemporary' for DB compatibility
    const dbStyle = style === 'other' ? 'contemporary' : style;
    const { data: visualization, error: dbError } = await supabase
      .from('visualizations')
      .insert(withSiteId({
        original_photo_url: originalImageUrl,
        room_type: dbRoomType as 'kitchen' | 'bathroom' | 'living_room' | 'bedroom' | 'basement' | 'dining_room',
        style: dbStyle,
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
      }))
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
      mode: (mode === 'streamlined' ? 'quick' : mode) || 'quick',
      photoAnalyzed: !!photoAnalysis,
      conversationTurns: (conversationContext as Record<string, unknown>)?.['turnCount'] as number || 0,
    }).catch((err) => console.error('Failed to record metrics:', err));

    // Build response — use effective types for schema compliance
    const response: VisualizationResponse = {
      id: visualization.id,
      originalImageUrl,
      roomType: effectiveRoomType,
      style: effectiveStyle,
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
  // Concept 0 uses iterative refinement; concepts 1-3 are single-shot
  const promises = Array.from({ length: count }, async (_, i) => {
    try {
      let result: GeneratedImage | null;

      if (i === 0 && AI_CONFIG.pipeline.enableIterativeRefinement) {
        // Primary concept gets iterative refinement
        const refined = await generateWithRefinement(imageBase64, config);
        result = refined.image;
        if (refined.wasRefined) {
          console.log(`Concept 0 was refined (validation score: ${refined.validationScore})`);
        }
      } else {
        result = await generateVisualizationConcept(
          imageBase64,
          config,
          undefined,
          undefined,
          i
        );
      }

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
  // Photo analysis: ~$0.015, depth estimation: ~$0.002, edge detection: $0, 4 concepts: ~$0.40, validation: ~$0.01
  const analysisCost = metrics.photoAnalyzed ? 0.015 : 0;
  const depthCost = 0.002; // Replicate per-prediction cost
  const generationCost = metrics.conceptsGenerated * 0.10; // ~$0.10 per concept (with conditioning)
  const validationCost = metrics.validationScore !== undefined ? 0.01 : 0;
  const totalCost = analysisCost + depthCost + generationCost + validationCost;

  // Insert metrics record (table may not exist until migration applied)
  // Using type assertion since visualization_metrics table is created by migration
  const metricsData = withSiteId({
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
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)('visualization_metrics').insert(metricsData);

  if (error) {
    // Log but don't throw - metrics recording shouldn't block the response
    console.error('Failed to record visualization metrics:', error);
  }
}
