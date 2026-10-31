import { fitWithin, JPEG_QUALITY } from './domain/image';

export interface PreparedPhoto { image: Blob; width: number; height: number }

/**
 * Decodes a picked photo and re-encodes it as a downscaled JPEG. Browsers apply the
 * EXIF orientation when drawing an <img>, so portrait phone photos stay upright.
 */
export async function preparePhoto(file: Blob): Promise<PreparedPhoto> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const target = fitWithin({ width: img.naturalWidth, height: img.naturalHeight });
    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.imageSmoothingQuality = 'high';
    context.drawImage(img, 0, 0, target.width, target.height);
    const image = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!image) throw new Error('Encoding failed');
    return { image, width: target.width, height: target.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}
