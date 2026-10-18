/**
 * PictoTrack's OpenCV preprocessing, rewritten in plain typed arrays.
 *
 * The desktop app runs greyscale → Otsu threshold → dilation before handing
 * the frame to Tesseract. These are the same three steps, pure and
 * dependency-free so they can run either in a worker (OffscreenCanvas) or in
 * chunks on the main thread when the browser has no OffscreenCanvas.
 *
 * Kept in src/lib rather than inside the worker so both paths run *the same*
 * code — a fallback that quietly differs from the real path is worse than no
 * fallback at all.
 */

/** Rec.601 luma, the weighting OpenCV's COLOR_BGR2GRAY uses. */
export function greyscale(rgba: Uint8ClampedArray): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rgba.length);
  for (let i = 0; i < rgba.length; i += 4) {
    const y = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
    out[i] = out[i + 1] = out[i + 2] = y;
    out[i + 3] = 255;
  }
  return out;
}

/**
 * Otsu's method: pick the threshold that maximises between-class variance.
 * One pass to build the 256-bin histogram, one pass over the bins.
 */
export function otsuThreshold(grey: Uint8ClampedArray): number {
  const hist = new Uint32Array(256);
  let total = 0;
  for (let i = 0; i < grey.length; i += 4) {
    hist[grey[i]] += 1;
    total += 1;
  }

  let sum = 0;
  for (let t = 0; t < 256; t += 1) sum += t * hist[t];

  let sumB = 0;
  let wB = 0;
  let best = 0;
  let bestVariance = -1;

  for (let t = 0; t < 256; t += 1) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;

    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) * (mB - mF);

    if (variance > bestVariance) {
      bestVariance = variance;
      best = t;
    }
  }
  return best;
}

/** Above the threshold is foreground (white), as in PictoTrack's THRESH_BINARY. */
export function binarise(
  grey: Uint8ClampedArray,
  threshold: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(grey.length);
  for (let i = 0; i < grey.length; i += 4) {
    const v = grey[i] > threshold ? 255 : 0;
    out[i] = out[i + 1] = out[i + 2] = v;
    out[i + 3] = 255;
  }
  return out;
}

/** 3×3 square dilation — thickens strokes so the OCR has solid glyphs. */
export function dilate3x3(
  binary: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(binary.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let max = 0;
      for (let dy = -1; dy <= 1 && max < 255; dy += 1) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const v = binary[(ny * width + nx) * 4];
          if (v > max) max = v;
          if (max === 255) break;
        }
      }
      const i = (y * width + x) * 4;
      out[i] = out[i + 1] = out[i + 2] = max;
      out[i + 3] = 255;
    }
  }
  return out;
}

/** Longest edge capped at 1024 — past that the OCR gains nothing and the loops cost. */
export function fitWithin(w: number, h: number, max = 1024) {
  const scale = Math.min(1, max / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}
