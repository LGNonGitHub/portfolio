'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useMediaQuery';

type Petal = {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  rot: number;
  spin: number;
  sway: number;
  phase: number;
  hue: 0 | 1;
  alpha: number;
};

/**
 * Sparse petals drifting across the whole page — the quiet counterweight to the
 * sigils and HUD panels. Deliberately low-density and low-alpha: it should
 * register as atmosphere, not weather.
 */
export function Petals({ density = 1 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let petals: Petal[] = [];
    let frame = 0;
    let running = true;
    let t = 0;

    const readVar = (name: string, fallback: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
      fallback;

    let hues = [readVar('--accent', '60 214 140'), readVar('--accent-2', '162 118 255')];

    const make = (seeded = false): Petal => ({
      x: Math.random() * w,
      y: seeded ? Math.random() * h : -20,
      size: 4 + Math.random() * 7,
      speed: 0.18 + Math.random() * 0.42,
      drift: (Math.random() - 0.5) * 0.28,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.012,
      sway: 14 + Math.random() * 26,
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() > 0.5 ? 1 : 0,
      alpha: 0.06 + Math.random() * 0.12,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(Math.min((w * h) / 78000, 18) * density);
      petals = Array.from({ length: count }, () => make(true));
    };

    /** A single petal: two mirrored quadratic curves meeting at a point. */
    const drawPetal = (p: Petal) => {
      const s = p.size;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // Squash on the spin axis so petals appear to tumble in 3D.
      ctx.scale(1, 0.45 + Math.abs(Math.cos(p.rot * 1.3)) * 0.55);
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s * 0.78, -s * 0.2, 0, s);
      ctx.quadraticCurveTo(-s * 0.78, -s * 0.2, 0, -s);
      ctx.closePath();
      ctx.fillStyle = `rgb(${hues[p.hue]} / ${p.alpha})`;
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      if (!running) return;
      t += 1;
      ctx.clearRect(0, 0, w, h);

      for (const p of petals) {
        p.y += p.speed;
        p.x += p.drift + Math.sin(t * 0.006 + p.phase) * (p.sway * 0.012);
        p.rot += p.spin;

        if (p.y > h + 30) Object.assign(p, make(), { y: -20 });
        if (p.x < -40) p.x = w + 30;
        if (p.x > w + 40) p.x = -30;

        drawPetal(p);
      }
      frame = requestAnimationFrame(render);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!running) {
        running = true;
        frame = requestAnimationFrame(render);
      }
    };

    const themeObserver = new MutationObserver(() => {
      hues = [readVar('--accent', '60 214 140'), readVar('--accent-2', '162 118 255')];
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-accent'],
    });

    resize();
    frame = requestAnimationFrame(render);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      themeObserver.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced, density]);

  if (reduced) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1]"
    />
  );
}
