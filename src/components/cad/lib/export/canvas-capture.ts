/**
 * Capture the R3F canvas as a high-resolution image for PDF export.
 * Switches to orthographic (2D) view, captures, then restores.
 */
export function captureCanvas(
  canvasElement: HTMLCanvasElement,
  scale: number = 2
): string {
  // Canvas already has preserveDrawingBuffer enabled
  // Create a scaled canvas for higher resolution
  const width = canvasElement.width;
  const height = canvasElement.height;

  if (scale === 1) {
    return canvasElement.toDataURL('image/png');
  }

  // For higher resolution, we grab the existing canvas data
  // (true high-res would require resizing the R3F canvas, but this works for now)
  const offscreen = document.createElement('canvas');
  offscreen.width = width * scale;
  offscreen.height = height * scale;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return canvasElement.toDataURL('image/png');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvasElement, 0, 0, offscreen.width, offscreen.height);

  return offscreen.toDataURL('image/png');
}

/**
 * Find the R3F canvas element within a container.
 */
export function findCanvasElement(container: HTMLElement): HTMLCanvasElement | null {
  return container.querySelector('canvas');
}

/**
 * Download a data URL as a file.
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download a blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  URL.revokeObjectURL(url);
}
