"use client";

import { useEffect, useRef } from "react";
import {
  AdditiveBlending,
  NormalBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  WebGLRenderer,
  CanvasTexture,
} from "three";

/**
 * The hero's summoning circle, rendered on the GPU.
 *
 * Three counter-rotating rings, a seven-point star and a field of drifting
 * motes. It reads --accent and --accent-2 off the document, so it re-tints
 * itself as you scroll through the five section themes and when the
 * sword/wand duality switch is thrown — the SVG version it replaces could
 * only ever be one colour at a time.
 *
 * Decorative: `aria-hidden`, and it renders nothing a screen reader or a
 * printer would want.
 */

/** `--accent` computes to "R G B" (three numbers), not a colour function. */
function readChannel(name: string, fallback: [number, number, number]) {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const n = raw
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  return n.length >= 3 && n.every((v) => Number.isFinite(v))
    ? ([n[0], n[1], n[2]] as [number, number, number])
    : fallback;
}

/** A soft round sprite, so motes are discs rather than squares. */
function moteTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  // A solid core with a short falloff. A soft gradient sprite looks pretty
  // in isolation but averages out to near-transparent at these dot sizes.
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.55, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

function ring(radius: number, segments: number) {
  const pts = new Float32Array(segments * 3);
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts[i * 3] = Math.cos(a) * radius;
    pts[i * 3 + 1] = 0;
    pts[i * 3 + 2] = Math.sin(a) * radius;
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pts, 3));
  return g;
}

/** Radial tick marks around a ring — the "runes". */
function ticks(count: number, inner: number, outer: number) {
  const pts = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const long = i % 4 === 0;
    const o = long ? outer : inner + (outer - inner) * 0.45;
    pts.set([c * inner, 0, s * inner, c * o, 0, s * o], i * 6);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pts, 3));
  return g;
}

/**
 * Concentric rings of dots, denser as the radius grows so the spacing stays
 * even. This is the body of the sigil: WebGL draws every line one pixel wide
 * no matter the display, so dot density — not stroke weight — is the only
 * way to make the form read on a light background.
 */
function dottedDisc(rings: number, rMin: number, rMax: number) {
  const pts: number[] = [];
  for (let r = 0; r < rings; r++) {
    const radius = rMin + ((rMax - rMin) * r) / (rings - 1);
    const count = Math.max(12, Math.round(radius * 46));
    const phase = r * 0.7;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + phase;
      pts.push(
        Math.cos(a) * radius,
        (Math.random() - 0.5) * 0.05,
        Math.sin(a) * radius,
      );
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pts), 3));
  return g;
}

/** Star polygon: every `skip`-th vertex of a regular n-gon, as in the SVG sigil. */
function star(points: number, skip: number, radius: number) {
  const pts: number[] = [];
  for (let i = 0; i < points; i++) {
    const a1 = (i / points) * Math.PI * 2 - Math.PI / 2;
    const a2 = (((i + skip) % points) / points) * Math.PI * 2 - Math.PI / 2;
    pts.push(
      Math.cos(a1) * radius,
      0,
      Math.sin(a1) * radius,
      Math.cos(a2) * radius,
      0,
      Math.sin(a2) * radius,
    );
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pts), 3));
  return g;
}

export function ManaCore({
  className,
  style,
  onReady,
}: {
  className?: string;
  style?: React.CSSProperties;
  /** Fires once the context is live, so the SVG fallback can step aside. */
  onReady?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const ready = useRef(onReady);
  ready.current = onReady;

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      return; // no WebGL — the hero still has its gradient and grid behind it
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(el.clientWidth, el.clientHeight, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    el.appendChild(renderer.domElement);
    ready.current?.();

    const scene = new Scene();
    const camera = new PerspectiveCamera(
      42,
      el.clientWidth / el.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 2.7, 8.6);
    camera.lookAt(0, 0, 0);

    const sigil = new Group();
    sigil.rotation.x = 0.26;
    scene.add(sigil);

    const accent = new Color();
    const accent2 = new Color();

    // Rings counter-rotate at different rates; that is the whole motion idea.
    const ringMat = new LineBasicMaterial({ transparent: true, opacity: 0.78 });
    const tickMat = new LineBasicMaterial({ transparent: true, opacity: 0.6 });
    const starMat = new LineBasicMaterial({ transparent: true, opacity: 0.5 });
    const haloMat = new LineBasicMaterial({ transparent: true, opacity: 0.3 });

    const outer = new LineLoop(ring(3.05, 160), ringMat);
    const mid = new LineLoop(ring(2.45, 140), ringMat);
    const inner = new LineLoop(ring(1.5, 100), ringMat);
    // Two more concentric hairlines: a single ring reads thin, because
    // WebGL ignores LineBasicMaterial.linewidth and every line is 1px.
    // Density is the only way to get visual weight here.
    const halo = new LineLoop(ring(3.32, 170), haloMat);
    const core = new LineLoop(ring(0.78, 80), haloMat);
    const rune = new LineSegments(ticks(56, 2.6, 2.95), tickMat);
    const fine = new LineSegments(ticks(120, 1.56, 1.72), haloMat);
    const heptagram = new LineSegments(star(7, 3, 2.2), starMat);
    sigil.add(outer, mid, inner, halo, core, rune, fine, heptagram);

    // Mana motes: a flattened spherical shell so the disc keeps its silhouette.
    const COUNT = 1100;
    const pos = new Float32Array(COUNT * 3);
    const drift = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.4 + Math.random() * 1.9;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1.1;
      pos[i * 3 + 2] = Math.sin(a) * r;
      drift[i] = 0.2 + Math.random() * 0.8;
    }
    const moteGeo = new BufferGeometry();
    moteGeo.setAttribute("position", new BufferAttribute(pos, 3));
    const sprite = moteTexture();
    // Additive blending is invisible on a light background — adding light to
    // near-white does nothing — so it is used only when the page is dark.
    const moteMat = new PointsMaterial({
      size: 0.07,
      map: sprite,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });

    const motes = new Points(moteGeo, moteMat);
    sigil.add(motes);

    const discGeo = dottedDisc(22, 0.55, 3.0);
    const discMat = new PointsMaterial({
      size: 0.062,
      map: sprite,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const disc = new Points(discGeo, discMat);
    sigil.add(disc);

    const applyBlending = () => {
      const dark = document.documentElement.dataset.theme === "dark";
      moteMat.blending = dark ? AdditiveBlending : NormalBlending;
      moteMat.opacity = dark ? 0.8 : 0.5;
      moteMat.needsUpdate = true;
      discMat.blending = dark ? AdditiveBlending : NormalBlending;
      discMat.needsUpdate = true;
    };
    applyBlending();
    const themeWatch = new MutationObserver(applyBlending);
    themeWatch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    // Pointer parallax, lerped so it glides rather than snaps.
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const onResize = () => {
      if (!el.clientWidth || !el.clientHeight) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight, false);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    // Only animate while on screen and while the tab is in front.
    let onScreen = true;
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(el);

    let frame = 0;
    let raf = 0;

    const applyColours = () => {
      const [r1, g1, b1] = readChannel("--accent", [34, 139, 94]);
      const [r2, g2, b2] = readChannel("--accent-2", [124, 92, 200]);
      accent.setRGB(r1 / 255, g1 / 255, b1 / 255);
      accent2.setRGB(r2 / 255, g2 / 255, b2 / 255);
      ringMat.color.copy(accent);
      tickMat.color.copy(accent);
      haloMat.color.copy(accent);
      discMat.color.copy(accent);
      starMat.color.copy(accent2);
      moteMat.color.copy(accent).lerp(accent2, 0.45);
    };
    applyColours();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!onScreen || document.hidden) return;

      frame++;
      // getComputedStyle is not cheap; six times a second keeps the theme
      // transition looking continuous without costing a frame.
      if (frame % 10 === 0) applyColours();

      const t = frame / 60;
      cur.x += (target.x - cur.x) * 0.045;
      cur.y += (target.y - cur.y) * 0.045;

      outer.rotation.y = t * 0.06;
      mid.rotation.y = -t * 0.1;
      inner.rotation.y = t * 0.17;
      rune.rotation.y = -t * 0.045;
      halo.rotation.y = -t * 0.025;
      fine.rotation.y = t * 0.09;
      core.rotation.y = -t * 0.2;
      disc.rotation.y = t * 0.028;
      heptagram.rotation.y = t * 0.035;
      motes.rotation.y = t * 0.02;

      // Motes bob on their own phase so the field breathes.
      const p = moteGeo.getAttribute("position") as BufferAttribute;
      for (let i = 0; i < COUNT; i++) {
        p.array[i * 3 + 1] += Math.sin(t * drift[i] + i) * 0.0012;
      }
      p.needsUpdate = true;

      sigil.rotation.z = cur.x * 0.12;
      sigil.rotation.x = 0.26 + cur.y * 0.1;
      camera.position.x = cur.x * 0.5;
      camera.position.y = 2.7 - cur.y * 0.35;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    if (reduced) {
      // One frame, then nothing moves. The sigil is still there to look at.
      renderer.render(scene, camera);
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      themeWatch.disconnect();
      [outer, mid, inner, halo, core, rune, fine, heptagram].forEach((m) =>
        m.geometry.dispose(),
      );
      moteGeo.dispose();
      discGeo.dispose();
      sprite.dispose();
      [ringMat, tickMat, haloMat, starMat, moteMat, discMat].forEach((m) =>
        m.dispose(),
      );
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} aria-hidden className={className} style={style} />;
}
