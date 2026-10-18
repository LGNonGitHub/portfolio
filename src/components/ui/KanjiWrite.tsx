'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { animate, useInView } from 'framer-motion';
import strokeData from '@/lib/kanji/strokes.json';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

/**
 * A section's kanji, written in its real stroke order.
 *
 * Each character is one 109×109 SVG (KanjiVG's own grid) holding three
 * layers of the same Mincho glyph:
 *   1. a ghost at 6% — the paper the ink lands on
 *   2. the ink, masked by KanjiVG's stroke paths drawn on one by one
 *   3. a hairline of those same paths in the second accent — the brush's
 *      track, faded back once the character is finished
 *
 * The strokes are KanjiVG centrelines, not the font's outlines, so they are
 * fitted onto the glyph at runtime: once Shippori Mincho has loaded, the
 * glyph's ink box is measured and the stroke group is scaled onto it. The ink
 * box comes from canvas measureText's actualBoundingBox metrics rather than
 * <text>.getBBox(), which returns the em box — that would fit the strokes to
 * the cell around the glyph and leave every hairline a few units off its
 * stroke. getBBox remains the fallback.
 *
 * Pacing: each stroke's duration follows its length (clamp(len/109·0.7,
 * .12, .45) s), so a long sweep takes longer than a dot. A character is then
 * time-compressed to a budget that grows with its stroke count, which keeps
 * the rhythm but stops 魔's 21 strokes taking four seconds; 作品 writes in
 * about 1.5 s. Characters follow each other after a 120 ms lift.
 *
 * When a character finishes, its mask is dropped and the ink renders whole,
 * so no gap is left where the 15-unit mask brush missed a serif.
 *
 * Reduced motion, 静 (html[data-motion=still]), missing stroke data or a font
 * that has not arrived within 3 s all render the finished glyph instead.
 *
 * Decorative: the English heading beside it carries the meaning, so every SVG
 * is aria-hidden.
 */

type State = 'idle' | 'writing' | 'done';
type Fit = { y: number; transform: string };

const STROKES = strokeData as unknown as Record<string, string[]>;

/** Baseline that centres Shippori Mincho's ideographs (ink −8.9…85.3 of a
 *  100-unit em) in the 109-unit cell — used until the real box is measured. */
const BASELINE = 92.5;
/** KanjiVG paths are centrelines; the glyph's ink box includes half a stroke
 *  of thickness on every side, so the target box is pulled in by that much. */
const INSET = 3.2;
const FONT_TIMEOUT = 3000;
const CHAR_PAUSE = 0.12;
/** The stroke ease: a brush presses in, travels, and lifts. */
const EASE = [0.65, 0, 0.35, 1] as const;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

function prefersStill() {
  try {
    return (
      document.documentElement.dataset.motion === 'still' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch {
    return false;
  }
}

/** Cubic-bezier easing evaluated by bisection — enough for 30 strokes. */
function bezier([x1, y1, x2, y2]: readonly number[]) {
  const at = (a: number, b: number, t: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (at(x1, x2, mid) < x) lo = mid;
      else hi = mid;
    }
    return at(y1, y2, (lo + hi) / 2);
  };
}

/** The glyph's ink box in SVG user units, with the text anchored at
 *  (54.5, baseline), text-anchor middle, font-size 100. */
function inkBox(text: SVGTextElement, ch: string, baseline: number) {
  const family = getComputedStyle(text).fontFamily;
  const ctx = document.createElement('canvas').getContext('2d');
  if (ctx) {
    ctx.font = `800 100px ${family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const m = ctx.measureText(ch);
    if (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent > 0) {
      return {
        x0: 54.5 - m.actualBoundingBoxLeft,
        x1: 54.5 + m.actualBoundingBoxRight,
        y0: baseline - m.actualBoundingBoxAscent,
        y1: baseline + m.actualBoundingBoxDescent,
      };
    }
  }
  const b = text.getBBox();
  return { x0: b.x, x1: b.x + b.width, y0: b.y, y1: b.y + b.height };
}

/** Recentres the glyph vertically, then maps the stroke centrelines' box
 *  onto the glyph's ink box (inset by half a stroke). */
function fitChar(svg: SVGSVGElement, ch: string): Fit | null {
  const text = svg.querySelector<SVGTextElement>('text');
  const hair = svg.querySelector<SVGGElement>('[data-hair]');
  if (!text || !hair) return null;
  const ink = inkBox(text, ch, BASELINE);
  const dy = 54.5 - (ink.y0 + ink.y1) / 2;
  const box = {
    x0: ink.x0 + INSET,
    x1: ink.x1 - INSET,
    y0: ink.y0 + dy + INSET,
    y1: ink.y1 + dy - INSET,
  };
  const s = hair.getBBox();
  if (!s.width || !s.height || box.x1 <= box.x0 || box.y1 <= box.y0) return null;
  const sx = (box.x1 - box.x0) / s.width;
  const sy = (box.y1 - box.y0) / s.height;
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return {
    y: r(BASELINE + dy),
    transform: `matrix(${r(sx)} 0 0 ${r(sy)} ${r(box.x0 - s.x * sx)} ${r(box.y0 - s.y * sy)})`,
  };
}

export function KanjiWrite({
  text,
  className,
  size = 'column',
}: {
  text: string;
  className?: string;
  /**
   * column — a stack of full-width glyphs, for a grid column.
   * gutter — the same stack drawn tighter for a narrow phone gutter; from lg
   * up it reverts to a column, so one instance can serve both layouts (a
   * second, display:none copy would never enter view and never finish).
   */
  size?: 'column' | 'gutter';
}) {
  const chars = useMemo(() => Array.from(text), [text]);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const ref = useRef<HTMLDivElement>(null);
  const svgs = useRef<(SVGSVGElement | null)[]>([]);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });

  const hasData = chars.map((ch) => (STROKES[ch]?.length ?? 0) > 0);
  const [states, setStates] = useState<State[]>(() =>
    chars.map((_, i) => (hasData[i] ? 'idle' : 'done')),
  );
  const [fits, setFits] = useState<(Fit | null)[]>(() => chars.map(() => null));
  /** 'pending' until the font has loaded (or timed out) and the fit is made. */
  const [ready, setReady] = useState<'pending' | 'ok' | 'failed'>('pending');

  const finishAll = () => setStates(chars.map(() => 'done'));

  // Reduced motion and 静 skip straight to the finished glyphs.
  useEffect(() => {
    if (reduced || prefersStill()) finishAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  // Wait for the Mincho, then fit every character's strokes onto its glyph.
  useEffect(() => {
    let cancelled = false;
    const first = svgs.current.find(Boolean)?.querySelector('text');
    if (!first || !hasData.some(Boolean)) {
      setReady('failed');
      return;
    }
    const family = getComputedStyle(first).fontFamily;
    const timeout = new Promise<'timeout'>((r) =>
      setTimeout(() => r('timeout'), FONT_TIMEOUT),
    );
    const load = (document.fonts?.load(`800 100px ${family}`, text) ??
      Promise.resolve([])) as Promise<unknown>;
    Promise.race([load.then(() => 'loaded' as const), timeout])
      .catch(() => 'timeout' as const)
      .then((result) => {
        if (cancelled) return;
        if (result === 'timeout') {
          setReady('failed');
          return;
        }
        setFits(
          chars.map((ch, i) => {
            const svg = svgs.current[i];
            if (!svg || !hasData[i]) return null;
            try {
              return fitChar(svg, ch);
            } catch {
              return null;
            }
          }),
        );
        setReady('ok');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // A font that never arrived means nothing to fit to: show the plain ink.
  useEffect(() => {
    if (ready === 'failed') finishAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Write, once the column is in view and the strokes are fitted.
  useEffect(() => {
    if (!inView || ready !== 'ok') return;
    if (reduced || prefersStill()) {
      finishAll();
      return;
    }
    if (states.every((s) => s === 'done')) return;

    const ease = bezier(EASE);
    type Stroke = { el: SVGPathElement[]; start: number; dur: number };
    const plan: { char: number; strokes: Stroke[]; end: number }[] = [];
    let t = 0;
    chars.forEach((_, i) => {
      const svg = svgs.current[i];
      if (!svg || !hasData[i] || states[i] === 'done') return;
      const masks = Array.from(svg.querySelectorAll<SVGPathElement>('mask path'));
      const hairs = Array.from(svg.querySelectorAll<SVGPathElement>('[data-hair] path'));
      const natural = hairs.map((p) => {
        let len = 40;
        try {
          len = p.getTotalLength();
        } catch {}
        return clamp((len / 109) * 0.7, 0.12, 0.45);
      });
      const total = natural.reduce((a, b) => a + b, 0);
      const budget = clamp(hairs.length * 0.09, 0.5, 1.1);
      const k = Math.min(1, budget / total);
      if (plan.length) t += CHAR_PAUSE;
      const strokes = hairs.map((h, s) => {
        const stroke = { el: [h, masks[s]].filter(Boolean), start: t, dur: natural[s] * k };
        t += stroke.dur;
        return stroke;
      });
      plan.push({ char: i, strokes, end: t });
    });
    if (!plan.length) return;

    setStates((prev) => prev.map((s, i) => (plan[0].char === i ? 'writing' : s)));
    const settled = new Set<number>();
    const settle = (char: number) => {
      if (settled.has(char)) return;
      settled.add(char);
      setStates((prev) =>
        prev.map((s, i) => {
          if (i === char) return 'done';
          const next = plan.find((p) => !settled.has(p.char));
          return next && next.char === i ? 'writing' : s;
        }),
      );
    };

    const controls = animate(0, t, {
      duration: t,
      ease: 'linear',
      onUpdate: (now) => {
        for (const c of plan) {
          for (const s of c.strokes) {
            const p = s.dur > 0 ? clamp((now - s.start) / s.dur, 0, 1) : 1;
            const v = String(1 - ease(p));
            for (const el of s.el) el.style.strokeDashoffset = v;
          }
          if (now >= c.end) settle(c.char);
        }
      },
      onComplete: () => plan.forEach((c) => settle(c.char)),
    });

    // 静 can be switched on mid-stroke; finish at once rather than play out.
    const html = document.documentElement;
    const observer = new MutationObserver(() => {
      if (html.dataset.motion === 'still') {
        controls.stop();
        finishAll();
      }
    });
    observer.observe(html, { attributes: true, attributeFilter: ['data-motion'] });

    return () => {
      controls.stop();
      observer.disconnect();
    };
    // Runs once per trigger; `states` is read as a snapshot on purpose so the
    // per-character updates above do not restart the animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, ready, reduced]);

  return (
    <div
      ref={ref}
      aria-hidden
      data-size={size}
      className={cn(
        'pointer-events-none flex select-none flex-col',
        size === 'gutter' ? '-space-y-[6%] lg:space-y-[4%]' : 'space-y-[4%]',
        className,
      )}
    >
      {chars.map((ch, i) => {
        const paths = STROKES[ch] ?? [];
        const state = states[i];
        const fit = fits[i];
        const done = state === 'done';
        const maskId = `kw-${uid}-${i}`;
        const y = fit?.y ?? BASELINE;
        // Before the fit lands the strokes are not aligned to the glyph, so
        // the hairline stays hidden rather than showing a misregistered trace.
        const hairOpacity = !fit ? 0 : done ? 0.25 : 1;
        return (
          <svg
            key={`${ch}-${i}`}
            ref={(el) => {
              svgs.current[i] = el;
            }}
            viewBox="0 0 109 109"
            data-kanji-write
            data-state={state}
            aria-hidden
            focusable="false"
            className="block h-auto w-full overflow-visible"
          >
            {paths.length > 0 && !done && (
              <defs>
                <mask
                  id={maskId}
                  maskUnits="userSpaceOnUse"
                  x="-20"
                  y="-20"
                  width="149"
                  height="149"
                >
                  <g
                    transform={fit?.transform}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={15}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {paths.map((d, s) => (
                      <path
                        key={s}
                        d={d}
                        pathLength={1}
                        strokeDasharray={1}
                        strokeDashoffset={1}
                      />
                    ))}
                  </g>
                </mask>
              </defs>
            )}
            <text
              x="54.5"
              y={y}
              textAnchor="middle"
              fontSize={100}
              fontWeight={800}
              style={{ fill: 'rgb(var(--fg) / 0.06)' }}
            >
              {ch}
            </text>
            <text
              x="54.5"
              y={y}
              textAnchor="middle"
              fontSize={100}
              fontWeight={800}
              mask={paths.length > 0 && !done ? `url(#${maskId})` : undefined}
              style={{ fill: 'rgb(var(--accent))' }}
            >
              {ch}
            </text>
            {paths.length > 0 && (
              <g
                data-hair
                transform={fit?.transform}
                fill="none"
                strokeWidth={0.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  stroke: 'rgb(var(--accent-2))',
                  opacity: hairOpacity,
                  transition: 'opacity 700ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {paths.map((d, s) => (
                  <path
                    key={s}
                    d={d}
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={done ? 0 : 1}
                    // The writer drives stroke-dashoffset as an inline style;
                    // handing React the final value here overrides whatever
                    // a stopped animation left behind.
                    style={done ? { strokeDashoffset: 0 } : undefined}
                  />
                ))}
              </g>
            )}
          </svg>
        );
      })}
    </div>
  );
}
