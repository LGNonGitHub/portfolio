/**
 * ManaStage — one raw WebGL2 context for the whole page.
 *
 * This replaces three.js and the ManaCore sigil (~122 kB gz of lazy chunk,
 * plus a per-frame CPU upload of 1,100 motes) with about 8 kB of hand-written
 * GL. One particle body wears seven formations and morphs between them as you
 * scroll, so the same object is on stage from the hero to つづく.
 *
 * The composite also paints what CSS used to: the section wash, the grain
 * overlay and the vignette. Those CSS layers stay in the sheet as the no-GL
 * fallback and are switched off by html.gl (see styles/stage.css).
 */
import { startDirector } from '@/lib/gl/director';
import { bake, FORMATION_COUNT } from '@/lib/gl/formations';
import { budget, tierFor, type Tier } from '@/lib/gl/quality';
import { compFS, downFS, particleFS, particleVS, quadVS, upFS } from '@/lib/gl/shaders';

/** Audit marker: the budget test looks for this string in the loaded chunk. */
export const __MANA_STAGE__ = 1;

export type DrawState = {
  from: number;
  to: number;
  mix: number;
  offset: [number, number];
  scale: number;
  time: number;
  ambient: number;
  fall: number;
  swarm: number;
  grain: number;
  ink: number;
  bg: [number, number, number];
  c1: [number, number, number];
  c2: [number, number, number];
  avoid: number[];
  avoidSoft: number[];
};

export type Stage = {
  tier: Tier;
  draw: (s: DrawState) => void;
  dispose: () => void;
};

/** Per-formation camera: the hero lies flat and spins; the SAO tower turns. */
export const TILT = [-1.15, 0, 0, 0, 0.32, 0, 0];
export const SPINZ = [0.07, 0, 0, 0, 0, 0.03, 0]; // [0] = SPIN in galaxy.ts
export const SPINY = [0, 0, 0, 0, 0.12, 0, 0];

type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };

export function init(opts: { canvas: HTMLCanvasElement; floors: number; runes: number }) {
  const { canvas } = opts;
  const glCtx = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    depth: false,
    powerPreference: 'high-performance',
  });
  if (!glCtx) return null;
  const gl = glCtx;

  const tier = tierFor();
  const { N, dpr, mips: MIPS } = budget(tier);
  const W = 256;
  const { data, seeds, rows } = bake(N, W, { floors: opts.floors, runes: opts.runes });

  // RGBA16F keeps additive blending from clipping; RGBA8 is the fallback and
  // runs at a lower gain so it does not blow out.
  const float16 = Boolean(
    gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'),
  );

  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, '#version 300 es\nprecision highp float;\n' + src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s) || 'shader');
    }
    return s;
  };
  const prog = (vs: string, fs: string): Prog => {
    const p = gl.createProgram()!;
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(p) || 'link');
    }
    const u: Record<string, WebGLUniformLocation | null> = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(p, i)!.name;
      u[name] = gl.getUniformLocation(p, name);
      // array uniforms report as "uAvoid[0]"; keep a bare alias too
      const bare = name.replace(/\[0\]$/, '');
      if (bare !== name) u[bare] = u[name];
    }
    return { p, u };
  };

  // The formation atlas: W x (rows * 7), xyz = position, w = brightness + group.
  const ftex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, ftex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA32F,
    W,
    rows * FORMATION_COUNT,
    0,
    gl.RGBA,
    gl.FLOAT,
    data,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const sb = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, sb);
  gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);

  const particles = prog(particleVS(W, rows), particleFS);
  const down = prog(quadVS, downFS);
  const up = prog(quadVS, upFS);
  const comp = prog(quadVS, compFS);

  type RT = { t: WebGLTexture; f: WebGLFramebuffer; w: number; h: number };
  const targets: RT[] = [];
  const rt = (w: number, h: number): RT => {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    if (float16) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const f = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    const out = { t, f, w, h };
    targets.push(out);
    return out;
  };
  const dropTargets = () => {
    for (const t of targets) {
      gl.deleteTexture(t.t);
      gl.deleteFramebuffer(t.f);
    }
    targets.length = 0;
  };

  let scene: RT;
  let mips: RT[] = [];
  let vw = 0;
  let vh = 0;
  function resize() {
    vw = Math.max(1, Math.round(window.innerWidth * dpr));
    vh = Math.max(1, Math.round(window.innerHeight * dpr));
    if (canvas.width === vw && canvas.height === vh && scene) return;
    canvas.width = vw;
    canvas.height = vh;
    dropTargets();
    scene = rt(vw, vh);
    mips = [];
    let w = vw;
    let h = vh;
    for (let i = 0; i < MIPS; i++) {
      w = Math.max(1, w >> 1);
      h = Math.max(1, h >> 1);
      mips.push(rt(w, h));
    }
  }
  resize();

  let drawN = N; // the governor may halve this when frames run long
  let ema = 16;
  const bloomK = float16 ? 1.6 : 0.9;

  function draw(s: DrawState) {
    if (gl.isContextLost()) return;
    const t0 = performance.now();
    resize();

    // particles -> scene
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.f);
    gl.viewport(0, 0, scene.w, scene.h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(particles.p);
    const u = particles.u;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, ftex);
    gl.uniform1i(u.uF ?? null, 0);
    gl.uniform1f(u.uFrom ?? null, s.from);
    gl.uniform1f(u.uTo ?? null, s.to);
    gl.uniform1f(u.uMix ?? null, s.mix);
    gl.uniform1f(u.uTime ?? null, s.time);
    gl.uniform1f(u.uAspect ?? null, vw / vh);
    gl.uniform1f(u.uScale ?? null, s.scale);
    gl.uniform1f(u.uDpr ?? null, dpr);
    gl.uniform1f(u.uAmbient ?? null, s.ambient);
    gl.uniform1f(u.uFall ?? null, s.fall);
    gl.uniform1f(u.uSwarm ?? null, s.swarm);
    gl.uniform2f(u.uOffset ?? null, s.offset[0], s.offset[1]);
    gl.uniform3f(u.uC1 ?? null, s.c1[0], s.c1[1], s.c1[2]);
    gl.uniform3f(u.uC2 ?? null, s.c2[0], s.c2[1], s.c2[2]);
    const fi = Math.round(s.from);
    const ti = Math.round(s.to);
    gl.uniform1f(u.uTiltA ?? null, TILT[fi]);
    gl.uniform1f(u.uTiltB ?? null, TILT[ti]);
    gl.uniform1f(u.uSpinZA ?? null, SPINZ[fi]);
    gl.uniform1f(u.uSpinZB ?? null, SPINZ[ti]);
    gl.uniform1f(u.uSpinYA ?? null, SPINY[fi]);
    gl.uniform1f(u.uSpinYB ?? null, SPINY[ti]);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.POINTS, 0, drawN);
    gl.disable(gl.BLEND);

    // bloom: dual-Kawase down then up
    let src = scene;
    gl.useProgram(down.p);
    for (const m of mips) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, m.f);
      gl.viewport(0, 0, m.w, m.h);
      gl.bindTexture(gl.TEXTURE_2D, src.t);
      gl.uniform1i(down.u.uT ?? null, 0);
      gl.uniform2f(down.u.uPx ?? null, 0.5 / src.w, 0.5 / src.h);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      src = m;
    }
    gl.useProgram(up.p);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    for (let i = mips.length - 1; i > 0; i--) {
      const d = mips[i - 1];
      gl.bindFramebuffer(gl.FRAMEBUFFER, d.f);
      gl.viewport(0, 0, d.w, d.h);
      gl.bindTexture(gl.TEXTURE_2D, mips[i].t);
      gl.uniform1i(up.u.uT ?? null, 0);
      gl.uniform2f(up.u.uPx ?? null, 0.5 / mips[i].w, 0.5 / mips[i].h);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.disable(gl.BLEND);

    // composite to the canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, vw, vh);
    gl.useProgram(comp.p);
    const cu = comp.u;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, scene.t);
    gl.uniform1i(cu.uScene ?? null, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, mips[0].t);
    gl.uniform1i(cu.uBloom ?? null, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1f(cu.uTime ?? null, s.time);
    gl.uniform1f(cu.uBloomK ?? null, bloomK);
    gl.uniform1f(cu.uInk ?? null, s.ink);
    gl.uniform1f(cu.uGrain ?? null, s.grain);
    gl.uniform3f(cu.uBg ?? null, s.bg[0], s.bg[1], s.bg[2]);
    gl.uniform3f(cu.uC1 ?? null, s.c1[0], s.c1[1], s.c1[2]);
    gl.uniform3f(cu.uC2 ?? null, s.c2[0], s.c2[1], s.c2[2]);
    gl.uniform2f(cu.uRes ?? null, vw, vh);
    const n = Math.min(16, s.avoid.length / 4);
    gl.uniform1i(cu.uAvoidN ?? null, n);
    if (n > 0) {
      const rects = new Float32Array(64);
      rects.set(s.avoid.slice(0, n * 4));
      const soft = new Float32Array(16);
      soft.set(s.avoidSoft.slice(0, n));
      gl.uniform4fv(cu.uAvoid ?? null, rects);
      gl.uniform1fv(cu.uAvoidSoft ?? null, soft);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // frame-time governor: a slow GPU draws fewer motes rather than fewer frames
    ema = ema * 0.9 + (performance.now() - t0) * 0.1;
    if (ema > 20 && drawN > N / 4) drawN = Math.max(N >> 2, (drawN * 0.75) | 0);
    else if (ema < 10 && drawN < N) drawN = Math.min(N, (drawN * 1.1 + 64) | 0);
  }

  const stage: Stage = {
    tier,
    draw,
    dispose: () => {
      dropTargets();
      gl.deleteTexture(ftex);
      gl.deleteBuffer(sb);
      gl.deleteVertexArray(vao);
    },
  };

  const stopDirector = startDirector(stage, canvas);
  return {
    ...stage,
    dispose: () => {
      stopDirector();
      stage.dispose();
    },
  };
}
