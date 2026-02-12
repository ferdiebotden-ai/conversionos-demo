/**
 * Depth Estimation Service
 * Uses Depth Anything 3 via Replicate API for metric depth estimation
 * Provides structural understanding for image generation conditioning
 */

import { AI_CONFIG } from './config';

export interface DepthEstimationResult {
  /** Depth map as base64 PNG (grayscale — lighter = closer, darker = farther) */
  depthMapBase64: string;
  /** Depth map MIME type */
  mimeType: string;
  /** Minimum depth in meters */
  minDepth: number;
  /** Maximum depth in meters */
  maxDepth: number;
}

/**
 * Estimate metric depth from a single room photo using Depth Anything V3
 * Requires REPLICATE_API_TOKEN env var. Returns null if unavailable.
 *
 * @param imageBase64 - Room photo as base64 (with or without data URL prefix)
 * @returns Depth map + metric range, or null on failure/unavailability
 */
export async function estimateDepth(
  imageBase64: string
): Promise<DepthEstimationResult | null> {
  const apiToken = process.env['REPLICATE_API_TOKEN'];
  if (!apiToken) {
    console.log('Depth estimation skipped: REPLICATE_API_TOKEN not set');
    return null;
  }

  // Ensure we have a data URL
  const dataUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const timeout = AI_CONFIG.replicate.depthTimeout;

  try {
    // Create prediction
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
      },
      body: JSON.stringify({
        version: 'latest',
        model: AI_CONFIG.replicate.depthModel,
        input: {
          image: dataUrl,
        },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Depth estimation API error:', createResponse.status, errorText);
      return null;
    }

    let prediction = await createResponse.json();

    // If the "Prefer: wait" header worked, we may already have the result
    // Otherwise, poll for completion
    const startTime = Date.now();
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      if (Date.now() - startTime > timeout) {
        console.warn('Depth estimation timed out');
        return null;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const pollResponse = await fetch(prediction.urls.get, {
        headers: { 'Authorization': `Bearer ${apiToken}` },
      });

      if (!pollResponse.ok) {
        console.error('Depth estimation poll error:', pollResponse.status);
        return null;
      }

      prediction = await pollResponse.json();
    }

    if (prediction.status === 'failed') {
      console.error('Depth estimation failed:', prediction.error);
      return null;
    }

    const output = prediction.output;
    if (!output) {
      console.error('Depth estimation returned no output');
      return null;
    }

    // Output is a URL to the depth map image — fetch and convert to base64
    const depthMapUrl = typeof output === 'string' ? output : output.depth_map || output[0];
    if (!depthMapUrl) {
      console.error('Depth estimation: no depth map URL in output');
      return null;
    }

    const depthMapResponse = await fetch(depthMapUrl);
    if (!depthMapResponse.ok) {
      console.error('Failed to fetch depth map image');
      return null;
    }

    const depthMapBuffer = await depthMapResponse.arrayBuffer();
    const depthMapBase64 = Buffer.from(depthMapBuffer).toString('base64');
    const mimeType = depthMapResponse.headers.get('content-type') || 'image/png';

    // Extract depth range from prediction metadata or use defaults
    const minDepth = output.min_depth ?? 0.1;
    const maxDepth = output.max_depth ?? 10.0;

    return {
      depthMapBase64,
      mimeType,
      minDepth: typeof minDepth === 'number' ? minDepth : 0.1,
      maxDepth: typeof maxDepth === 'number' ? maxDepth : 10.0,
    };
  } catch (error) {
    console.error('Depth estimation error:', error);
    return null;
  }
}
