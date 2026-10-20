/**
 * The twin singularity: two spiral arms wound round one core — 剣 on one arm,
 * 杖 on the other, the site's duality as an orbit instead of a switch.
 *
 * One shape, drawn three ways: the GL stage's hero formation, the intro's
 * canvas, and the SVG the hero falls back to without WebGL. They all read it
 * from here so the intro lands on exactly the drawing the page then holds.
 *
 * Coordinates are a unit disc in screen orientation (y down): x and y in
 * [-1, 1], z a thin thickness. Each caller scales to its own space.
 */

/** Which arm a star belongs to, or the core. */
export type Arm = 0 | 1 | 'core';

export type Star = {
  x: number;
  y: number;
  z: number;
  arm: Arm;
  /** Brightness: 0.32 for the dust, ~0.5 at an arm's rim to ~1.25 in the core. */
  b: number;
};

/** How far each arm winds from the core to the rim, in turns. */
const TURNS = 1.1;
/** Share of stars in the core, and in the faint disc between the arms. */
const CORE = 0.08;
const DUST = 0.22;

/**
 * One star. Takes the caller's random source so the GL formations can keep
 * drawing from their own seeded stream; `i` alternates the arms so both get
 * the same count.
 */
export function star(rand: () => number, i: number): Star {
  const u = rand();
  if (u < CORE) {
    // Squared so the core is dense at the centre and thins out. Kept below
    // the arms' peak brightness: the bloom already blows a dense core white.
    const rad = rand() ** 2 * 0.15;
    const a = rand() * Math.PI * 2;
    return {
      x: Math.cos(a) * rad,
      y: Math.sin(a) * rad,
      z: (rand() - 0.5) * 0.06,
      arm: 'core',
      b: 1.25 - rad * 3,
    };
  }
  const arm: Arm = i % 2 === 0 ? 0 : 1;
  if (u < CORE + DUST) {
    // A faint disc between the arms. Without it the arms read as two loose
    // ribbons; with it they read as the bright lanes of one galaxy.
    const rad = 0.15 + Math.sqrt(rand()) * 0.85;
    const a = rand() * Math.PI * 2;
    return {
      x: Math.cos(a) * rad,
      y: Math.sin(a) * rad,
      z: (rand() - 0.5) * 0.04,
      arm,
      b: 0.32,
    };
  }
  // Biased outward a little, so the arms reach the rim instead of bunching.
  const d = 0.08 + rand() ** 0.8 * 0.92;
  const along = (arm === 0 ? 0 : Math.PI) + d * TURNS * Math.PI * 2;
  // Triangular spread: dense on the arm's spine, feathered at the edges, and
  // widening toward the rim the way real arms do.
  const a = along + (rand() + rand() - 1) * (0.22 + d * 0.5);
  const rad = d + (rand() + rand() - 1) * (0.03 + d * 0.06);
  return {
    x: Math.cos(a) * rad,
    y: Math.sin(a) * rad,
    z: (rand() - 0.5) * 0.05 * (1 - d),
    arm,
    b: 0.5 + (1 - d) * 0.8,
  };
}

/** A whole galaxy from a fixed seed, so server and client draw the same one. */
export function galaxy(n: number, seed = 11): Star[] {
  let s = (seed * 9301 + 49297) % 2147483647;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: n }, (_, i) => star(rand, i));
}

/**
 * The GL stage tilts the hero formation by -1.15 rad about x (engine.ts
 * TILT[0]); cos of that is how flat the disc reads on screen. The 2D
 * drawings squash by the same amount so the intro lands on the same ellipse.
 */
export const TILT_SQUASH = Math.cos(1.15);

/** Matches SPINZ[0] in engine.ts, in radians per second. */
export const SPIN = 0.07;
