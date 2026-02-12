/**
 * Edge Detection Service
 * Server-side Canny-style edge extraction using sharp
 * Produces architectural edge maps (walls, counters, windows, doors) for structural conditioning
 * ~200ms processing time, $0.00 cost
 */

import sharp from 'sharp';

export interface EdgeDetectionResult {
  /** Edge map as base64 PNG (white edges on black background) */
  edgeMapBase64: string;
  /** Edge map MIME type */
  mimeType: string;
}

/**
 * Extract architectural edges from a room photo using Sobel-based edge detection
 *
 * Pipeline: Grayscale → Gaussian blur → Sobel gradient → threshold
 * Uses sharp's built-in convolution for zero external dependencies
 *
 * @param imageBase64 - Room photo as base64 (with or without data URL prefix)
 * @returns Edge map as base64 PNG, or null on failure
 */
export async function extractEdges(
  imageBase64: string
): Promise<EdgeDetectionResult | null> {
  try {
    // Strip data URL prefix if present
    const base64Data = imageBase64.includes('base64,')
      ? imageBase64.split('base64,')[1]!
      : imageBase64;

    const inputBuffer = Buffer.from(base64Data, 'base64');

    // Step 1: Convert to grayscale and apply Gaussian blur for noise reduction
    const grayscaleBlurred = await sharp(inputBuffer)
      .grayscale()
      .blur(1.5)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data: pixels, info } = grayscaleBlurred;
    const { width, height } = info;

    // Step 2: Sobel gradient computation
    // Sobel X kernel: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]
    // Sobel Y kernel: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]
    const edgePixels = Buffer.alloc(width * height);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (i: number, j: number) => pixels[(y + j) * width + (x + i)]!;

        // Sobel X
        const gx =
          -idx(-1, -1) + idx(1, -1) +
          -2 * idx(-1, 0) + 2 * idx(1, 0) +
          -idx(-1, 1) + idx(1, 1);

        // Sobel Y
        const gy =
          -idx(-1, -1) - 2 * idx(0, -1) - idx(1, -1) +
          idx(-1, 1) + 2 * idx(0, 1) + idx(1, 1);

        // Gradient magnitude
        const magnitude = Math.sqrt(gx * gx + gy * gy);

        // Threshold for edge detection — tuned for architectural features
        edgePixels[y * width + x] = magnitude > 50 ? 255 : 0;
      }
    }

    // Step 3: Convert edge map back to PNG
    const edgeMapBuffer = await sharp(edgePixels, {
      raw: { width, height, channels: 1 },
    })
      .png()
      .toBuffer();

    return {
      edgeMapBase64: edgeMapBuffer.toString('base64'),
      mimeType: 'image/png',
    };
  } catch (error) {
    console.error('Edge detection error:', error);
    return null;
  }
}
