/**
 * Image Utilities
 * Compression and processing utilities for uploaded images
 */

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;

/**
 * Check if file is HEIC/HEIF format
 */
function isHeicFile(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  );
}

/**
 * Convert HEIC file to JPEG using dynamic import (client-side only)
 */
async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    // Dynamic import to avoid SSR issues - heic2any uses window
    const heic2any = (await import('heic2any')).default;

    const result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: JPEG_QUALITY,
    });

    // heic2any can return a single blob or array of blobs
    const blob = Array.isArray(result) ? result[0] : result;
    if (!blob) {
      throw new Error('HEIC conversion returned empty result');
    }

    return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
      type: 'image/jpeg',
    });
  } catch (error) {
    console.error('HEIC conversion failed:', error);
    throw new Error(
      'Unable to process HEIC image. Please convert to JPG or PNG and try again.'
    );
  }
}

/**
 * Compress an image file to be under 2MB and max 1920px
 */
export async function compressImage(file: File): Promise<File> {
  // Convert HEIC to JPEG first
  let processableFile = file;
  if (isHeicFile(file)) {
    processableFile = await convertHeicToJpeg(file);
  }

  // If already small enough and correct format, return as-is
  if (
    processableFile.size <= MAX_SIZE &&
    (processableFile.type === 'image/jpeg' || processableFile.type === 'image/png')
  ) {
    const img = await loadImage(processableFile);
    if (img.width <= MAX_DIMENSION && img.height <= MAX_DIMENSION) {
      return processableFile;
    }
  }

  const img = await loadImage(processableFile);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Calculate new dimensions
  let { width, height } = img;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;

  // Draw image
  ctx.drawImage(img, 0, 0, width, height);

  // Convert to blob with compression
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to compress image'));
      },
      'image/jpeg',
      JPEG_QUALITY
    );
  });

  // If still too large, reduce quality further
  if (blob.size > MAX_SIZE) {
    return compressWithQuality(canvas, 0.7);
  }

  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
    type: 'image/jpeg',
  });
}

/**
 * Compress with specific quality setting
 */
async function compressWithQuality(canvas: HTMLCanvasElement, quality: number): Promise<File> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to compress image'));
      },
      'image/jpeg',
      quality
    );
  });

  // If still too large and quality can be reduced, try again
  if (blob.size > MAX_SIZE && quality > 0.3) {
    return compressWithQuality(canvas, quality - 0.1);
  }

  return new File([blob], 'image.jpg', { type: 'image/jpeg' });
}

/**
 * Load image from file
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert file to base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
  return validTypes.includes(file.type);
}

/**
 * Get image dimensions from file
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const img = await loadImage(file);
  return { width: img.width, height: img.height };
}
