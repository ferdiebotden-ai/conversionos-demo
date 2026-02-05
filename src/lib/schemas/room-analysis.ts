/**
 * Room Analysis Schema
 * Zod schema for AI vision analysis output
 */

import { z } from 'zod';

/**
 * Room type enum for analysis
 */
export const RoomTypeSchema = z.enum([
  'kitchen',
  'bathroom',
  'bedroom',
  'living_room',
  'basement',
  'exterior',
  'other',
]);

export type RoomType = z.infer<typeof RoomTypeSchema>;

/**
 * Condition assessment enum
 */
export const ConditionSchema = z.enum([
  'good',
  'fair',
  'needs_work',
  'major_renovation_needed',
]);

export type Condition = z.infer<typeof ConditionSchema>;

/**
 * Room analysis result schema
 */
export const RoomAnalysisSchema = z.object({
  roomType: RoomTypeSchema,
  confidence: z.number().min(0).max(1),
  currentCondition: ConditionSchema,
  identifiedFeatures: z.array(z.string()),
  estimatedSize: z.string().nullable(),
  suggestedImprovements: z.array(z.string()).optional(),
  potentialChallenges: z.array(z.string()).optional(),
});

export type RoomAnalysis = z.infer<typeof RoomAnalysisSchema>;

/**
 * Kitchen-specific features that may be identified
 */
export const KITCHEN_FEATURES = [
  'cabinets',
  'countertops',
  'backsplash',
  'sink',
  'faucet',
  'dishwasher',
  'refrigerator',
  'stove',
  'range hood',
  'microwave',
  'island',
  'flooring',
  'lighting',
  'windows',
] as const;

/**
 * Bathroom-specific features that may be identified
 */
export const BATHROOM_FEATURES = [
  'vanity',
  'sink',
  'faucet',
  'toilet',
  'bathtub',
  'shower',
  'tile flooring',
  'tile walls',
  'mirror',
  'lighting',
  'exhaust fan',
  'storage',
] as const;

/**
 * Basement-specific features that may be identified
 */
export const BASEMENT_FEATURES = [
  'finished walls',
  'unfinished walls',
  'flooring',
  'concrete floor',
  'drop ceiling',
  'exposed ceiling',
  'windows',
  'egress window',
  'support columns',
  'utility area',
  'moisture signs',
] as const;
