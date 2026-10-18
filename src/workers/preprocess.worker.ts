/// <reference lib="webworker" />

/**
 * Runs PictoTrack's preprocessing off the main thread.
 *
 * A 1024px frame is about a million pixels through four passes; on the main
 * thread that is a visible stall on a mid-range phone. The bitmap is
 * transferred in (not copied) and three bitmaps are transferred back out, so
 * nothing large is cloned in either direction.
 *
 * The algorithms live in src/lib/preprocess.ts so the no-OffscreenCanvas
 * fallback on the main thread runs exactly the same code.
 */
import {
  binarise,
  dilate3x3,
  fitWithin,
  greyscale,
  otsuThreshold,
} from '@/lib/preprocess';

export type PreprocessResult = {
  grey: ImageBitmap;
  binary: ImageBitmap;
  dilated: ImageBitmap;
  threshold: number;
  width: number;
  height: number;
};

self.onmessage = async (event: MessageEvent<{ bitmap: ImageBitmap }>) => {
  const { bitmap } = event.data;
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height);

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('no 2d context in worker');
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const source = ctx.getImageData(0, 0, width, height);
    const grey = greyscale(source.data);
    const threshold = otsuThreshold(grey);
    const binary = binarise(grey, threshold);
    const dilated = dilate3x3(binary, width, height);

    const toBitmap = (pixels: Uint8ClampedArray) =>
      createImageBitmap(new ImageData(pixels, width, height));

    const [greyBmp, binaryBmp, dilatedBmp] = await Promise.all([
      toBitmap(grey),
      toBitmap(binary),
      toBitmap(dilated),
    ]);

    self.postMessage(
      { ok: true, grey: greyBmp, binary: binaryBmp, dilated: dilatedBmp, threshold, width, height },
      [greyBmp, binaryBmp, dilatedBmp],
    );
  } catch (error) {
    self.postMessage({ ok: false, error: String(error) });
  }
};
