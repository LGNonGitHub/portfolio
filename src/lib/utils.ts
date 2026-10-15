import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Clamp a number between a min and max. */
export const clamp = (v: number, min = 0, max = 1) =>
  Math.min(Math.max(v, min), max);

/** Linear interpolation. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Map a value from one range to another. */
export const mapRange = (
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) => ((v - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

/** Split a string into words, each carrying its characters. Used for staggered text reveals. */
export function splitWords(text: string) {
  return text.split(' ').map((word) => ({ word, chars: Array.from(word) }));
}

/** Format a Date into a 24h clock string for a given IANA timezone. */
export function formatTime(date: Date, timeZone: string) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  }
}
