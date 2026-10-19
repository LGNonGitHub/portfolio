/**
 * Which tier the stage runs at, and whether it should be running at all.
 *
 * Budgets as code: phones are not asked to hold a perpetual canvas. On lite
 * the stage renders only while something is moving and stops entirely when
 * the page is still, so an idle phone spends nothing.
 */
import { runtime } from '@/lib/runtime';

export type Tier = 'full' | 'lite';

/** Reasons the stage declines to start at all; the SVG fallback stays. */
export function declined(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (new URLSearchParams(location.search).get('gl') === '0') return true;
  } catch {
    /* a malformed query string is not a reason to crash */
  }
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) return true;
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return true;
  const probe = document.createElement('canvas');
  return !probe.getContext('webgl2');
}

export function tierFor(): Tier {
  if (typeof window === 'undefined') return 'lite';
  if (window.innerWidth < 768) return 'lite';
  if (window.matchMedia('(pointer: coarse)').matches) return 'lite';
  return runtime.get().motion === 'lite' ? 'lite' : 'full';
}

/** Mote count and device pixel ratio per tier. */
export const budget = (tier: Tier) =>
  tier === 'full'
    ? { N: 24576, dpr: Math.min(window.devicePixelRatio || 1, 1.5), mips: 5 }
    : { N: 8192, dpr: 1, mips: 3 };

/** True when the page should paint only on invalidate, never continuously. */
export function quiet(): boolean {
  if (typeof window === 'undefined') return true;
  if (runtime.get().motion === 'still') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
