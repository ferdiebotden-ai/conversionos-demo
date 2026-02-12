/**
 * AI Configuration
 * Model constants and parameters for AI services
 */

export const AI_CONFIG = {
  openai: {
    chat: 'gpt-5.2',           // Production chat model
    extraction: 'gpt-5.2',     // Structured extraction
    vision: 'gpt-5.2',         // Photo analysis (multimodal) — 86.3% spatial reasoning accuracy
    moderation: 'omni-moderation-latest',
  },
  google: {
    imageGeneration: 'gemini-3-pro-image-preview', // Image generation model
  },
  replicate: {
    depthModel: 'depth-anything/depth-anything-v3-metric',
    depthTimeout: 25000,
  },
  pipeline: {
    enableDepthEstimation: true,
    enableEdgeDetection: true,
    enableIterativeRefinement: true,
  },
  parameters: {
    chat: {
      maxTokens: 1024,
      temperature: 0.7,
    },
    extraction: {
      maxTokens: 2048,
      temperature: 0.3,
    },
    vision: {
      maxTokens: 2500,
      temperature: 0.5,
    },
    imageGeneration: {
      structureReferenceStrength: 0.90, // Preserve room geometry
      styleStrength: 0.4,               // Apply style without overwhelming
      outputCount: 4,                   // Generate 4 variations
      timeout: 120000,                  // 120 second timeout
    },
  },
} as const;

export type ModelType = keyof typeof AI_CONFIG.openai;
