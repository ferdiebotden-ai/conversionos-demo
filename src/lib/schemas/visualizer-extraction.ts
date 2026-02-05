/**
 * Visualizer Extraction Schemas
 * Zod schemas for AI-extracted design intent from conversations
 */

import { z } from 'zod';
import { designStyleSchema, roomTypeSchema } from './visualization';

/**
 * Design intent extracted from user conversation
 * Represents what the user wants from the visualization
 */
export const DesignIntentSchema = z.object({
  /**
   * Specific changes the user wants to make
   * e.g., ["new countertops", "painted cabinets", "modern lighting"]
   */
  desiredChanges: z.array(z.string()),
  /**
   * Elements the user wants to preserve
   * e.g., ["existing layout", "cabinet boxes", "hardwood floors"]
   */
  constraintsToPreserve: z.array(z.string()),
  /**
   * Preferred design style if identified
   */
  stylePreference: z.string().optional(),
  /**
   * Specific materials mentioned
   * e.g., ["quartz counters", "subway tile", "brass hardware"]
   */
  materialPreferences: z.array(z.string()).optional(),
  /**
   * Budget-related indicators
   * e.g., ["high-end", "budget-friendly", "mid-range"]
   */
  budgetIndicators: z.array(z.string()).optional(),
  /**
   * Timeline indicators
   * e.g., ["need it done quickly", "no rush", "spring project"]
   */
  timelineIndicators: z.array(z.string()).optional(),
  /**
   * Priority elements (what matters most)
   */
  priorities: z.array(z.string()).optional(),
  /**
   * Extraction confidence score
   */
  confidenceScore: z.number().min(0).max(1).optional(),
});

export type DesignIntent = z.infer<typeof DesignIntentSchema>;

/**
 * Complete visualization context from conversation
 * Used to generate personalized prompts
 */
export const VisualizationContextSchema = z.object({
  /**
   * Room type (detected or user-specified)
   */
  roomType: roomTypeSchema,
  /**
   * Design style for generation
   */
  style: designStyleSchema,
  /**
   * Design intent extracted from conversation
   */
  designIntent: DesignIntentSchema,
  /**
   * Original user constraints text
   */
  constraintsText: z.string().optional(),
  /**
   * Conversation mode used
   */
  conversationMode: z.enum(['quick', 'conversation']).default('quick'),
  /**
   * Number of conversation turns
   */
  turnCount: z.number().int().min(0).optional(),
  /**
   * Whether photo was analyzed
   */
  photoAnalyzed: z.boolean().default(false),
});

export type VisualizationContext = z.infer<typeof VisualizationContextSchema>;

/**
 * Conversation message for visualizer chat
 */
export const VisualizerMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string().datetime(),
  /**
   * Extracted data from this message (if any)
   */
  extractedData: z.object({
    desiredChanges: z.array(z.string()).optional(),
    stylePreference: z.string().optional(),
    materialMentions: z.array(z.string()).optional(),
    constraints: z.array(z.string()).optional(),
  }).optional(),
});

export type VisualizerMessage = z.infer<typeof VisualizerMessageSchema>;

/**
 * State of the visualizer conversation
 */
export const VisualizerConversationStateSchema = z.enum([
  'photo_analysis',    // AI describing what it sees
  'intent_gathering',  // Asking about desired changes
  'style_selection',   // Helping pick a style
  'refinement',        // Clarifying specifics
  'generation_ready',  // Ready to generate
]);

export type VisualizerConversationState = z.infer<typeof VisualizerConversationStateSchema>;

/**
 * Complete conversation context for visualizer
 */
export const VisualizerConversationContextSchema = z.object({
  /**
   * Current conversation state
   */
  state: VisualizerConversationStateSchema,
  /**
   * Room analysis from photo (if available)
   */
  photoAnalysis: z.record(z.string(), z.unknown()).optional(),
  /**
   * Accumulated extracted data
   */
  extractedData: z.object({
    desiredChanges: z.array(z.string()),
    constraintsToPreserve: z.array(z.string()),
    stylePreference: designStyleSchema.optional(),
    materialPreferences: z.array(z.string()).optional(),
    roomType: roomTypeSchema.optional(),
    confidenceScore: z.number().min(0).max(1),
  }),
  /**
   * Conversation history
   */
  conversationHistory: z.array(VisualizerMessageSchema),
  /**
   * Turn count
   */
  turnCount: z.number().int().min(0),
  /**
   * Session ID
   */
  sessionId: z.string().uuid().optional(),
});

export type VisualizerConversationContext = z.infer<typeof VisualizerConversationContextSchema>;

/**
 * Readiness check result for visualization
 */
export const GenerationReadinessSchema = z.object({
  /**
   * Whether we have enough info to generate
   */
  isReady: z.boolean(),
  /**
   * What's still needed (if not ready)
   */
  missingInfo: z.array(z.string()),
  /**
   * Confidence in generation quality
   */
  qualityConfidence: z.number().min(0).max(1),
  /**
   * Suggested style if not specified
   */
  suggestedStyle: designStyleSchema.optional(),
  /**
   * Summary of what will be generated
   */
  generationSummary: z.string(),
});

export type GenerationReadiness = z.infer<typeof GenerationReadinessSchema>;
