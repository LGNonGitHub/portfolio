'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useMediaQuery';

type Particle = {
  x: number;
  y: number;
  px: number;
  py: number;
  speed: number;
  life: number;
  maxLife: number;
  /** 0 = primary accent, 1 = secondary. Two mana streams, not one. */
  hue: 0 | 1;
};

/**
 * A pseudo-noise flow field rendered to 2D canvas. Particles follow the field's
 * angle, leaving short trails that build into a drifting fabric. The pointer
 * applies a local repulsion so the field reacts to the visitor.
 *
 * Chosen over a WebGL/three.js setup on purpose: same visual payoff for a
 * fraction of the bundle, and it degrades to a static gradient under
 * reduced-motion instead of disappearing.
 */
export function FlowField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    let frame = 0;
    let time = 0;
    let running = true;

    const pointer = { x: -9999, y: -9999, active: false };

    const readVar = (name: string, fallback: string) =>
      getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim() || fallback;

    const accentOf = () => readVar('--accent', '60 214 140');
    const accent2Of = () => readVar('--accent-2', '162 118 255');

    const isLight = () => document.documentElement.dataset.theme === 'light';

    let accent = accentOf();
    let accent2 = accent2Of();
    // Dark strokes on a light background read fainter at the same alpha, so
    // the light palette gets a stronger multiplier.
    let alphaBoost = isLight() ? 2.1 : 1;

    /** Cheap smooth value noise — enough structure for a convincing field. */
    const noise = (x: number, y: number, t: number) => {
      const s =
        Math.sin(x * 0.0021 + t * 0.00022) * 1.6 +
        Math.sin(y * 0.0017 - t * 0.00031) * 1.4 +
        Math.sin((x + y) * 0.0013 + t * 0.00018) * 1.1 +
        Math.sin(Math.sqrt(x * x + y * y) * 0.0024 - t * 0.00026) * 0.9;
      return s / 5;
    };

    const angleAt = (x: number, y: number, t: number) =>
      noise(x, y, t) * Math.PI * 2;

    const spawn = (): Particle => ({
      x: Math.random() * w,
      y: Math.random() * h,
      px: 0,
      py: 0,
      speed: 0.35 + Math.random() * 1.15,
      life: 0,
      maxLife: 120 + Math.random() * 220,
      hue: Math.random() > 0.5 ? 1 : 0,
    });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Particle budget scales with area, capped so laptops stay cool.
      const target = Math.min(Math.floor((w * h) / 5200), 900);
      particles = Array.from({ length: target }, () => {
        const p = spawn();
        p.px = p.x;
        p.py = p.y;
        return p;
      });

      ctx.clearRect(0, 0, w, h);
    };

    const render = () => {
      if (!running) return;
      time += 16;

      // Fade the previous frame instead of clearing — this is what makes trails.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';

      for (const p of particles) {
        p.px = p.x;
        p.py = p.y;

        const a = angleAt(p.x, p.y, time);
        let vx = Math.cos(a) * p.speed;
        let vy = Math.sin(a) * p.speed;

        // Pointer repulsion, falling off smoothly to zero at the radius edge.
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          const radius = 190;
          if (d2 < radius * radius && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const force = (1 - d / radius) ** 2 * 3.4;
            vx += (dx / d) * force;
            vy += (dy / d) * force;
          }
        }

        p.x += vx;
        p.y += vy;
        p.life += 1;

        // Recycle particles that wander off or age out.
        if (
          p.life > p.maxLife ||
          p.x < -20 ||
          p.x > w + 20 ||
          p.y < -20 ||
          p.y > h + 20
        ) {
          Object.assign(p, spawn());
          p.px = p.x;
          p.py = p.y;
          continue;
        }

        const fade = Math.sin((p.life / p.maxLife) * Math.PI);
        const near =
          pointer.active &&
          Math.abs(p.x - pointer.x) < 190 &&
          Math.abs(p.y - pointer.y) < 190;

        const hue = p.hue === 0 ? accent : accent2;
        // Near the pointer the stream brightens and thickens, as if disturbed.
        ctx.strokeStyle = near
          ? `rgb(${hue} / ${Math.min(0.62 * alphaBoost, 0.9) * fade})`
          : `rgb(${hue} / ${Math.min(0.2 * alphaBoost, 0.44) * fade})`;
        ctx.lineWidth = near ? 1.4 : 0.75;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      frame = requestAnimationFrame(render);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    };

    // Stop burning frames when the canvas is scrolled away or the tab is hidden.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          frame = requestAnimationFrame(render);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(frame);
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!running) {
        running = true;
        frame = requestAnimationFrame(render);
      }
    };

    // Re-read the palette when the theme flips.
    const themeObserver = new MutationObserver(() => {
      accent = accentOf();
      accent2 = accent2Of();
      alphaBoost = isLight() ? 2.1 : 1;
      ctx.clearRect(0, 0, w, h);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-accent'],
    });

    resize();
    frame = requestAnimationFrame(render);

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      io.disconnect();
      themeObserver.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced]);

  if (reduced) {
    return (
      <div
        aria-hidden
        className={className}
        style={{
          background:
            'radial-gradient(70% 60% at 35% 40%, rgb(var(--accent) / 0.12), transparent 70%), radial-gradient(60% 55% at 70% 55%, rgb(var(--accent-2) / 0.1), transparent 70%)',
        }}
      />
    );
  }

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
