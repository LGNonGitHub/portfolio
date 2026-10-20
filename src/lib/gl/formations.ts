/**
 * The seven formations of the mana stage.
 *
 * One particle body wears seven shapes — the hero sigil and one per section —
 * and every shape is sampled from the site's OWN SectionArt geometry, so the
 * GPU stage and the SVG fallback are literally the same drawing. Each sampler
 * returns [x, y, z, w] where w = brightness + 10 * groupId; group 1 is the
 * contact bloom's loose petals, which the shader lets fall.
 *
 * Positions are baked once into an RGBA32F texture and fetched in the vertex
 * shader by gl_VertexID: no per-frame CPU upload, which is exactly what the
 * three.js ManaCore was doing wrong (1,100 motes re-uploaded every frame).
 */

import { star } from '@/lib/galaxy';

/** Deterministic PRNG, so the sigil is the same drawing on every visit. */
const rnd = (() => {
  let s = 7;
  return () =>
    ((s = (Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x9e3779b9) | 0) >>> 0) / 4294967296;
})();

type P4 = [number, number, number, number];

// SectionArt's SVG viewBox (420x500) mapped to roughly [-1,1].
const S = 1 / 190;
const CX = 210;
const CY = 250;
const sv = (x: number, y: number, z = 0, w = 1): P4 => [(x - CX) * S, -(y - CY) * S, z, w];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function onSeg(ax: number, ay: number, bx: number, by: number, w = 1): P4 {
  const t = rnd();
  return sv(lerp(ax, bx, t), lerp(ay, by, t), (rnd() - 0.5) * 0.03, w);
}

function onPoly(pts: number[][], w = 1, closed = false): P4 {
  const segs: [number[], number[], number][] = [];
  let L = 0;
  for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push([a, b, l]);
    L += l;
  }
  let r = rnd() * L;
  for (const [a, b, l] of segs) {
    if (r <= l) return onSeg(a[0], a[1], b[0], b[1], w);
    r -= l;
  }
  const [a, b] = segs[segs.length - 1];
  return onSeg(a[0], a[1], b[0], b[1], w);
}

function ring(cx: number, cy: number, r: number, w = 1, jitter = 0): P4 {
  const a = rnd() * 6.2832;
  const rr = r + (rnd() - 0.5) * jitter;
  return sv(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, (rnd() - 0.5) * 0.02, w);
}

function cubic(p0: number[], p1: number[], p2: number[], p3: number[], w = 1): P4 {
  const t = rnd();
  const u = 1 - t;
  const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
  const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
  return sv(x, y, 0, w);
}

/** Rejection-sample a point inside a polygon (the MHA bolt's solid body). */
function inPoly(pts: number[][], w = 1): P4 {
  let minx = 1e9;
  let maxx = -1e9;
  let miny = 1e9;
  let maxy = -1e9;
  for (const [x, y] of pts) {
    minx = Math.min(minx, x);
    maxx = Math.max(maxx, x);
    miny = Math.min(miny, y);
    maxy = Math.max(maxy, y);
  }
  for (let k = 0; k < 200; k++) {
    const x = lerp(minx, maxx, rnd());
    const y = lerp(miny, maxy, rnd());
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    if (c) return sv(x, y, (rnd() - 0.5) * 0.05, w);
  }
  return sv(pts[0][0], pts[0][1]);
}

type Table = [number, () => P4][];
const pick = (table: Table): P4 => {
  let r = rnd() * table.reduce((s, t) => s + t[0], 0);
  for (const [p, f] of table) {
    if (r < p) return f();
    r -= p;
  }
  return table[0][1]();
};

const starPoly = (n: number, skip: number, r: number, cx = CX, cy = CY, rot = -Math.PI / 2) => {
  const o: number[][] = [];
  for (let i = 0, v = 0; i <= n; i++, v = (v + skip) % n) {
    const a = (v / n) * 6.2832 + rot;
    o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return o;
};

export type FormationOpts = { floors: number; runes: number };

/** Index of each formation in the texture, in SECTION_IDS order. */
export const FORMATION_COUNT = 7;

/** Seven samplers, in the same order as runtime's SECTION_IDS. */
export function samplers({ floors, runes }: FormationOpts): (() => P4)[] {
  const nFloors = Math.max(2, Math.min(8, floors || 4));
  const nRunes = Math.max(3, Math.min(10, runes || 6));
  return [
    // 0 PROLOGUE/HERO — the twin singularity: 剣 and 杖 as two arms round one
    // core (src/lib/galaxy.ts). Group 3 paints the 剣 arm in the accent and
    // group 2 the 杖 arm in accent-2; the core keeps the seed's mix.
    (() => {
      let i = 0;
      return () => {
        const s = star(rnd, i++);
        // 190 design units is the old sigil's outer ring, so the slot fits.
        const p = sv(CX + s.x * 190, CY + s.y * 190, s.z, s.b);
        if (s.arm === 0) p[3] += 30;
        else if (s.arm === 1) p[3] += 20;
        return p;
      };
    })(),
    // 1 WORK · Black Clover — a grimoire thrown open under a pentagram
    () =>
      pick([
        [1.2, () => ring(CX, CY, 168, 0.7)],
        [1.4, () => ring(CX, CY, 146, 0.9, 6)],
        [2.2, () => onPoly(starPoly(5, 2, 146), 1.1)],
        [
          1.5,
          () =>
            rnd() < 0.5
              ? cubic([210, 212], [176, 186], [132, 174], [88, 174], 1.4)
              : cubic([210, 212], [244, 186], [288, 174], [332, 174], 1.4),
        ],
        [
          1.2,
          () =>
            rnd() < 0.5
              ? cubic([88, 364], [132, 364], [176, 376], [210, 402], 1.4)
              : cubic([332, 364], [288, 364], [244, 376], [210, 402], 1.4),
        ],
        [0.8, () => (rnd() < 0.5 ? onSeg(88, 174, 88, 364, 1.2) : onSeg(332, 174, 332, 364, 1.2))],
        [0.7, () => onSeg(210, 212, 210, 424, 1.3)],
        [
          1.6,
          () => {
            const i = Math.floor(rnd() * 7);
            const y = 214 + i * 22;
            return rnd() < 0.5 ? onSeg(106, y, 184, y, 0.8) : onSeg(236, y, 314, y, 0.8);
          },
        ],
        [
          1.4,
          () => {
            const s = [
              [160, 150],
              [268, 138],
              [210, 118],
              [128, 186],
              [300, 176],
            ][Math.floor(rnd() * 5)];
            const a = rnd() * 6.28;
            const r = rnd() * 9;
            const p = sv(s[0] + Math.cos(a) * r, s[1] + Math.sin(a) * r);
            p[2] = rnd() * 0.25;
            p[3] = 1.6;
            return p;
          },
        ],
      ]),
    // 2 ABOUT · My Hero Academia — a bolt through halftone, burst frame, speed lines
    () =>
      pick([
        [
          4,
          () =>
            inPoly(
              [
                [238, 130],
                [150, 268],
                [212, 268],
                [194, 390],
                [302, 238],
                [236, 238],
              ],
              1.5,
            ),
        ],
        [
          3,
          () => {
            const g = 9;
            const x = CX - 140 + Math.floor(rnd() * 31) * g;
            const y = CY - 140 + Math.floor(rnd() * 31) * g;
            const d = Math.hypot(x - CX, y - CY);
            return d < 140 ? sv(x, y, 0, 0.35 + 0.5 * (1 - d / 140)) : ring(CX, CY, 140, 0.3);
          },
        ],
        [
          1.6,
          () =>
            onPoly(
              Array.from({ length: 28 }, (_, i) => {
                const a = (i / 28) * 6.2832;
                const r = i % 2 ? 150 : 182;
                return [CX + Math.cos(a) * r, CY + Math.sin(a) * r * 1.08];
              }),
              0.8,
              true,
            ),
        ],
        [
          1.6,
          () => {
            const i = Math.floor(rnd() * 18);
            const a = (i / 18) * 6.2832;
            const w = i % 3 ? 0.6 : 1.2;
            return onSeg(
              CX + Math.cos(a) * 112,
              CY + Math.sin(a) * 112,
              CX + Math.cos(a) * 176,
              CY + Math.sin(a) * 176,
              w,
            );
          },
        ],
      ]),
    // 3 STACK · Wistoria — sword and wand crossed under a star chart
    () =>
      pick([
        [2.2, () => onSeg(126, 412, 300, 196, 1.4)],
        [0.5, () => onSeg(286, 170, 314, 196, 1.4)],
        [2.2, () => onSeg(296, 412, 132, 198, 1.4)],
        [1, () => onPoly(starPoly(5, 2, 16, 126, 190), 1.8)],
        [
          1.6,
          () => {
            const L = [
              [96, 128, 168, 92],
              [168, 92, 250, 118],
              [250, 118, 318, 86],
              [318, 86, 346, 168],
              [168, 92, 214, 150],
              [214, 150, 286, 206],
              [150, 186, 214, 150],
              [112, 318, 150, 186],
            ][Math.floor(rnd() * 8)];
            return onSeg(L[0], L[1], L[2], L[3], 0.5);
          },
        ],
        [
          1.4,
          () => {
            const s = [
              [96, 128],
              [168, 92],
              [250, 118],
              [318, 86],
              [346, 168],
              [78, 212],
              [150, 186],
              [286, 206],
              [112, 318],
              [330, 300],
              [214, 150],
              [60, 150],
            ][Math.floor(rnd() * 12)];
            const a = rnd() * 6.28;
            const r = Math.pow(rnd(), 2) * 7;
            return sv(s[0] + Math.cos(a) * r, s[1] + Math.sin(a) * r, 0, 1.8);
          },
        ],
        [1.2, () => ring(CX, CY, 178, 0.55)],
        [0.8, () => ring(CX, CY, 140, 0.4)],
      ]),
    // 4 PATH · Sword Art Online — a tower with one floor per real timeline entry
    //   and one orbiting rune cluster per real hackathon. The counts come from
    //   content.ts via init(), so the engine chunk never imports the content.
    () =>
      pick([
        [
          6,
          () => {
            const i = Math.floor(rnd() * nFloors);
            const r = 0.62 - i * (0.42 / nFloors);
            const y = -0.62 + i * (1.3 / nFloors);
            const a = rnd() * 6.2832;
            return [Math.cos(a) * r, y, Math.sin(a) * r * 0.55, 1 + i * 0.08];
          },
        ],
        [
          1.4,
          () => {
            const i = Math.floor(rnd() * nFloors);
            const r = 0.62 - i * (0.42 / nFloors);
            const y = -0.62 + i * (1.3 / nFloors) - 0.06;
            const a = rnd() * 6.2832;
            return [Math.cos(a) * r * 0.9, y, Math.sin(a) * r * 0.5, 0.45];
          },
        ],
        [0.6, () => [0, 0.78 + rnd() * 0.3, 0, 1.4]],
        [
          1.6,
          () => {
            // orbiting rune clusters: one per hackathon
            const i = Math.floor(rnd() * nRunes);
            const a = (i / nRunes) * 6.2832;
            const t = rnd() * 6.28;
            return [
              Math.cos(a) * 0.92 + Math.cos(t) * 0.07,
              0.1 + Math.sin(a * 1.7) * 0.45 + Math.sin(t) * 0.07,
              Math.sin(a) * 0.5,
              1.3,
            ];
          },
        ],
        [
          1.2,
          () => {
            const i = Math.floor(rnd() * 9);
            return [lerp(-1, 1, rnd()), -0.82 - i * 0.04, 0, 0.5 - i * 0.04];
          },
        ],
      ]),
    // 5 HOBBY · photography — a six-blade aperture iris with a focus-scale rim
    () =>
      pick([
        [
          4,
          () => {
            const i = Math.floor(rnd() * 6);
            const a = (i / 6) * 6.2832;
            const a2 = a + 1.25;
            return onSeg(
              CX + Math.cos(a) * 70,
              CY + Math.sin(a) * 70,
              CX + Math.cos(a2) * 175,
              CY + Math.sin(a2) * 175,
              1.1,
            );
          },
        ],
        [1.6, () => ring(CX, CY, 178, 1.1)],
        [1, () => ring(CX, CY, 192, 0.6)],
        [
          1.2,
          () => {
            const i = Math.floor(rnd() * 72);
            const a = (i / 72) * 6.2832;
            const l = i % 6 ? 6 : 14;
            return onSeg(
              CX + Math.cos(a) * 196,
              CY + Math.sin(a) * 196,
              CX + Math.cos(a) * (196 + l),
              CY + Math.sin(a) * (196 + l),
              0.8,
            );
          },
        ],
        [
          1.4,
          () => {
            const a = rnd() * 6.28;
            const r = Math.sqrt(rnd()) * 66;
            return sv(CX + Math.cos(a) * r, CY + Math.sin(a) * r, 0, 0.25);
          },
        ],
      ]),
    // 6 CONTACT · Fragrant Flower — five petals, stamens, and loose petals
    //   (group 1) that the shader lets fall. These are the site's only petals.
    () =>
      pick([
        [
          5,
          () => {
            const i = Math.floor(rnd() * 5);
            const t = rnd() * 6.2832;
            const ex = Math.cos(t) * 36;
            const ey = 186 - 250 + Math.sin(t) * 62;
            const a = ((i * 72) * Math.PI) / 180;
            return sv(
              CX + ex * Math.cos(a) - ey * Math.sin(a),
              CY + ex * Math.sin(a) + ey * Math.cos(a),
              0,
              1.1,
            );
          },
        ],
        [
          1,
          () => {
            const a = rnd() * 6.28;
            const r = Math.sqrt(rnd()) * 17;
            return sv(CX + Math.cos(a) * r, CY + Math.sin(a) * r, 0, 1.8);
          },
        ],
        [
          0.6,
          () => {
            const i = Math.floor(rnd() * 8);
            const a = (i / 8) * 6.2832;
            return sv(
              CX + Math.cos(a) * 26 + (rnd() - 0.5) * 4,
              CY + Math.sin(a) * 26 + (rnd() - 0.5) * 4,
              0,
              1.6,
            );
          },
        ],
        [
          2,
          () => {
            const P = [
              [78, 136, -28],
              [334, 160, 34],
              [60, 350, 18],
              [352, 372, -22],
              [128, 432, 8],
              [296, 452, -14],
              [166, 96, 24],
            ][Math.floor(rnd() * 7)];
            const t = rnd() * 6.28;
            const ex = Math.cos(t) * 8;
            const ey = Math.sin(t) * 14;
            const a = (P[2] * Math.PI) / 180;
            const p = sv(
              P[0] + ex * Math.cos(a) - ey * Math.sin(a),
              P[1] + ex * Math.sin(a) + ey * Math.cos(a),
            );
            p[2] = (rnd() - 0.5) * 0.4;
            p[3] = 0.8 + 10; // group 1: a loose petal, free to fall
            return p;
          },
        ],
        [1, () => ring(CX, CY, 162, 0.45)],
      ]),
  ];
}

/** Bake every formation into one Float32Array laid out as W x (ROWS*7). */
export function bake(N: number, W: number, opts: FormationOpts) {
  const rows = N / W;
  const data = new Float32Array(W * rows * FORMATION_COUNT * 4);
  samplers(opts).forEach((f, k) => {
    for (let i = 0; i < N; i++) data.set(f(), (k * N + i) * 4);
  });
  const seeds = new Float32Array(N * 4);
  for (let i = 0; i < N * 4; i++) seeds[i] = rnd();
  return { data, seeds, rows };
}
