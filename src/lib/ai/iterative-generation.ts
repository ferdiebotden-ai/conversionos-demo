/**
 * Iterative Refinement for Visualization Generation
 * Concept 0 gets a generate → validate → regenerate pass for higher structural accuracy
 * Concepts 1-3 remain single-shot for speed
 */

import { generateVisualizationConcept, type VisualizationConfig } from './visualization';
import type { GeneratedImage } from './gemini';
import { AI_CONFIG } from './config';

export interface IterativeResult {
  image: GeneratedImage;
  wasRefined: boolean;
  validationScore?: number;
}

/**
 * Generate the primary concept (concept 0) with optional iterative refinement
 * If first generation's structure validation fails, regenerate with stronger
 * structural preservation emphasis in the prompt
 *
 * @param imageBase64 - Source room photo
 * @param config - Visualization config with all conditioning data
 * @returns Generated image with refinement metadata
 */
export async function generateWithRefinement(
  imageBase64: string,
  config: VisualizationConfig
): Promise<IterativeResult> {
  if (!AI_CONFIG.pipeline.enableIterativeRefinement) {
    // Refinement disabled — single-shot generation
    const image = await generateVisualizationConcept(imageBase64, config, undefined, undefined, 0);
    if (!image) throw new Error('Primary concept generation failed');
    return { image, wasRefined: false };
  }

  // First pass: generate concept 0
  const firstPass = await generateVisualizationConcept(imageBase64, config, undefined, undefined, 0);
  if (!firstPass) throw new Error('Primary concept generation failed');

  // Validate structure if OpenAI key is available
  if (!process.env['OPENAI_API_KEY']) {
    return { image: firstPass, wasRefined: false };
  }

  try {
    // Dynamic import to avoid circular dependencies
    const { quickValidateImage } = await import('./validation');
    const validation = await quickValidateImage(
      imageBase64,
      `data:${firstPass.mimeType};base64,${firstPass.base64}`
    );

    if (validation.isAcceptable) {
      console.log(`Primary concept passed validation (score: ${validation.score})`);
      return { image: firstPass, wasRefined: false, validationScore: validation.score };
    }

    console.log(`Primary concept failed validation (score: ${validation.score}), refining...`);

    // Second pass: regenerate with stronger structural emphasis
    const reinforcedConfig: VisualizationConfig = {
      ...config,
      constraints: [
        config.constraints || '',
        'CRITICAL REFINEMENT: The previous generation did not adequately preserve room structure.',
        `Validation score was ${validation.score.toFixed(2)} — structural deviation detected.`,
        'Pay EXTRA attention to wall positions, window/door locations, and overall room geometry.',
      ].filter(Boolean).join(' '),
    };

    const secondPass = await generateVisualizationConcept(
      imageBase64,
      reinforcedConfig,
      undefined,
      undefined,
      0
    );

    if (!secondPass) {
      // Fall back to first pass if refinement fails
      return { image: firstPass, wasRefined: false, validationScore: validation.score };
    }

    return { image: secondPass, wasRefined: true, validationScore: validation.score };
  } catch (error) {
    console.warn('Iterative refinement validation failed, using first pass:', error);
    return { image: firstPass, wasRefined: false };
  }
}
