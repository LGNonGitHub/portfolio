#!/usr/bin/env node
/**
 * Budgets as code.
 *
 *   npm run build && npm run audit -- --serve
 *   node scripts/audit.mjs --only=keyboard,still-idle      (against :3000)
 *   node scripts/audit.mjs --serve --shots                  (plus screenshots)
 *
 * Boots nothing but a browser unless --serve is given; with --serve it starts
 * `next start -p 3123` from the existing .next in its own process group and
 * kills that group on exit. It never runs `next build`: an audit that builds
 * would be measuring whatever happened to be on disk, silently.
 *
 * Every gate is a promise this site makes — to phones on slow networks, to
 * keyboard and screen-reader users, to anyone who asked for less motion, and
 * to the visitor whose message we say we sent. A change that breaks one fails
 * here instead of shipping. Writes .audit/report.json; exits 1 on any failure.
 *
 * Numbers in [brackets] in GATE_INFO are what the site measured before the
 * Season One rebuild, so a regression is visible against where we started.
 *
 * Caveat: this sandbox-friendly setup renders WebGL through SwiftShader, which
 * inflates GPU-bound timings. The timing gates therefore run with ?gl=0 and
 * gate on main-thread work at 4x CPU throttle; treat GPU numbers as relative.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, '.audit');
const KB = 1024;

/* ── Gates ───────────────────────────────────────────────────────────── */

const GATE_INFO = {
  'lcp-mobile': '390x844, 4x CPU, 1.6 Mbps / 150 ms, ?gl=0, median of 3: LCP <= 2500 ms [5404]',
  cls: 'Cumulative layout shift on the same mobile runs (median) <= 0.05 [0.0028]',
  longtasks: 'Long-task time after FCP on the same runs (median) <= 600 ms [2352]',
  'js-initial': 'JS transferred before the load event on mobile <= 200 KB [191]',
  'no-three': 'No script containing three.module or the WebGLRenderer class',
  'stage-size': "The chunk carrying '__MANA_STAGE__' <= 12 KB encoded (skipped when absent)",
  fonts: 'Font bytes for a full mobile scroll <= 180 KB [~253]',
  axe: 'axe-core: zero serious/critical violations, every section at centre, both themes',
  'still-idle': '静 (pressed, then reloaded) and reduced motion: no running infinite animation, <= 2 rAF callbacks in 2 s',
  keyboard: 'First Tab is the skip link and lands in #main; the Stack link hands focus to #stack',
  resilience: "Aborting the PipelineBench / mana-stage chunks never shows 'Application error'",
  honesty: '/api/contact with no mail provider never answers delivered:true',
  'palette-parity': 'Every colour pair in globals.css and palettes.css equals src/lib/palettes.ts',
};
const GATES = Object.keys(GATE_INFO);

const BUDGET = {
  lcp: 2500,
  cls: 0.05,
  longtasks: 600,
  jsInitial: 200 * KB,
  stage: 12 * KB,
  fonts: 180 * KB,
  rafCallbacks: 2,
};

/* ── Arguments ───────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};

if (flag('help') || flag('h')) {
  console.log(`Usage: node scripts/audit.mjs [--serve] [--only=a,b] [--shots] [--base=URL]

  --serve       start \`next start -p 3123\` from the existing .next (never builds)
  --only=a,b    run a subset; a name ending in -skip is listed as skipped
  --shots       write section x theme x viewport x motion PNGs to .audit/shots/
  --base=URL    target (default $BASE_URL or http://localhost:3000)

Gates:
${GATES.map((g) => `  ${g.padEnd(15)} ${GATE_INFO[g]}`).join('\n')}`);
  process.exit(0);
}

const SERVE = flag('serve');
const SHOTS = flag('shots');
const SERVE_PORT = 3123;
const BASE_URL = (
  SERVE
    ? `http://localhost:${SERVE_PORT}`
    : opt('base') || process.env.BASE_URL || 'http://localhost:3000'
).replace(/\/$/, '');

let selected = GATES;
const skippedByFlag = [];
if (opt('only') !== undefined) {
  const names = opt('only')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const unknown = [];
  selected = [];
  for (const n of names) {
    if (n.endsWith('-skip')) skippedByFlag.push(n.slice(0, -'-skip'.length));
    else if (GATES.includes(n)) selected.push(n);
    else unknown.push(n);
  }
  if (unknown.length) {
    console.error(`audit: unknown gate(s): ${unknown.join(', ')}\nKnown: ${GATES.join(', ')}`);
    process.exit(2);
  }
}

/* ── Playwright ─────────────────────────────────────────────────────── */

let pw;
try {
  pw = await import('playwright');
} catch {
  pw = await import('/opt/node-tools/node_modules/playwright/index.js');
}
const chromium = pw.chromium ?? pw.default?.chromium;

const require = createRequire(path.join(ROOT, 'package.json'));

/* ── Server (--serve) ───────────────────────────────────────────────── */

let server = null;
let serverLog = '';

function stopServer() {
  if (!server || server.exitCode !== null) return;
  try {
    // Negative pid: the whole group, so next's worker processes go too.
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    /* already gone */
  }
}
process.on('exit', stopServer);
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    stopServer();
    process.exit(130);
  });
}

async function reachable(url, ms = 2000) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(ms), redirect: 'manual' });
    return res.status > 0;
  } catch {
    return false;
  }
}

async function startServer() {
  if (!fs.existsSync(path.join(ROOT, '.next', 'BUILD_ID'))) {
    throw new Error('No production build in .next. Run `npm run build` first; the audit never builds.');
  }
  if (await reachable(BASE_URL, 1000)) {
    throw new Error(`Port ${SERVE_PORT} is already in use; stop whatever is on it, or drop --serve and pass --base.`);
  }
  const env = { ...process.env, PORT: String(SERVE_PORT), NODE_ENV: 'production' };
  // The honesty gate must see a server with no mail provider.
  delete env.RESEND_API_KEY;
  delete env.CONTACT_TO_EMAIL;
  const nextBin = require.resolve('next/dist/bin/next');
  server = spawn(process.execPath, [nextBin, 'start', '-p', String(SERVE_PORT)], {
    cwd: ROOT,
    env,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (d) => (serverLog += d));
  server.stderr.on('data', (d) => (serverLog += d));
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    if (server.exitCode !== null) throw new Error(`next start exited early:\n${serverLog}`);
    if (await reachable(BASE_URL)) return;
    await sleep(500);
  }
  throw new Error(`next start did not answer on ${BASE_URL} within 60 s:\n${serverLog}`);
}

/* ── Helpers ────────────────────────────────────────────────────────── */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : NaN;
};
const kb = (b) => `${(b / KB).toFixed(1)} KB`;

const LAUNCH_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

const PROFILES = {
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  },
};

let browser;

/**
 * A fresh context (empty cache, empty storage) with the visitor state a gate
 * needs. The intro is skipped unless a gate asks for it: it plays once per
 * session for real visitors, and every gate here is about the page after it.
 */
async function newContext({
  profile = 'desktop',
  theme,
  reduced = false,
  still = false,
  intro = false,
  dpr,
} = {}) {
  const ctx = await browser.newContext({
    ...PROFILES[profile],
    ...(dpr ? { deviceScaleFactor: dpr } : {}),
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  await ctx.addInitScript(
    ({ theme, still, intro }) => {
      try {
        if (!intro) sessionStorage.setItem('preloaded', '1');
        if (theme) localStorage.setItem('theme', theme);
        if (still) localStorage.setItem('motion', 'still');
      } catch {
        /* storage blocked: the gate will say so through its result */
      }
    },
    { theme, still, intro },
  );
  return ctx;
}

const url = (p = '/') => `${BASE_URL}${p}`;

/** Walk the whole page, so lazy chunks, lazy fonts and in-view effects all run. */
async function scrollThrough(page, pause = 150) {
  await page.evaluate(async (pause) => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, pause));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, pause);
}

/** Records LCP, CLS, long tasks and FCP from the very start of the page. */
function vitalsInit() {
  window.__vitals = { lcp: [], cls: 0, longtasks: [], fcp: null };
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const el = e.element;
        window.__vitals.lcp.push({
          t: Math.round(e.startTime),
          el: el ? `${el.tagName.toLowerCase()} ${(el.textContent || el.currentSrc || '').trim().slice(0, 40)}` : null,
        });
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__vitals.longtasks.push({ t: Math.round(e.startTime), d: Math.round(e.duration) });
      }
    }).observe({ type: 'longtask', buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.name === 'first-contentful-paint') window.__vitals.fcp = Math.round(e.startTime);
      }
    }).observe({ type: 'paint', buffered: true });
  } catch {
    /* an old engine: the gates report missing numbers as failures */
  }
}

/** Every script and font the page fetched: url, CDP type, encoded bytes, finish time. */
async function trackNetwork(ctx, page) {
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Page.enable');
  const byId = new Map();
  const log = { requests: [], loadTs: null, cdp };
  cdp.on('Network.responseReceived', (e) => {
    byId.set(e.requestId, { url: e.response.url, type: e.type });
  });
  cdp.on('Network.loadingFinished', (e) => {
    const r = byId.get(e.requestId);
    if (r) log.requests.push({ ...r, bytes: e.encodedDataLength, ts: e.timestamp });
  });
  cdp.on('Page.loadEventFired', (e) => {
    if (log.loadTs === null) log.loadTs = e.timestamp;
  });
  return log;
}

/* ── Shared measurement runs (memoised: several gates read one run) ─── */

let mobileRuns;
async function mobileProfile() {
  if (mobileRuns) return mobileRuns;
  const runs = [];
  for (let i = 0; i < 3; i++) {
    const ctx = await newContext({ profile: 'mobile' });
    await ctx.addInitScript(vitalsInit);
    const page = await ctx.newPage();
    const net = await trackNetwork(ctx, page);
    await net.cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await net.cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1000 * 1000) / 8,
      uploadThroughput: (750 * 1000) / 8,
    });
    await page.goto(url('/?gl=0'), { waitUntil: 'load', timeout: 180_000 });
    // Hydration, idle-time chunks and the long tasks they cause land after
    // the load event; give them time to show up before reading.
    await sleep(4000);
    const v = await page.evaluate(() => window.__vitals);
    const fcp = v.fcp ?? 0;
    const lcp = v.lcp.at(-1);
    const scripts = net.requests.filter((r) => r.type === 'Script');
    runs.push({
      lcp: lcp?.t ?? null,
      lcpElement: lcp?.el ?? null,
      cls: +v.cls.toFixed(4),
      longtasks: v.longtasks.filter((t) => t.t >= fcp).reduce((s, t) => s + t.d, 0),
      jsInitial: scripts
        .filter((r) => net.loadTs === null || r.ts <= net.loadTs)
        .reduce((s, r) => s + r.bytes, 0),
      fcp,
    });
    await ctx.close();
  }
  mobileRuns = runs;
  return runs;
}

let crawled;
/** Desktop and mobile, unthrottled, whole page walked: every chunk and font. */
async function crawl() {
  if (crawled) return crawled;
  const scripts = new Map();
  const fonts = new Map();
  for (const profile of ['desktop', 'mobile']) {
    const ctx = await newContext({ profile });
    const page = await ctx.newPage();
    const net = await trackNetwork(ctx, page);
    const bodies = [];
    page.on('response', (res) => {
      if (res.request().resourceType() !== 'script') return;
      bodies.push(
        res
          .text()
          .then((text) => ({ url: res.url(), text }))
          .catch(() => null),
      );
    });
    await page.goto(url('/'), { waitUntil: 'load', timeout: 120_000 });
    await sleep(2500);
    await scrollThrough(page);
    await page.evaluate(() => document.fonts.ready);
    // Stage and bench chunks load in idle time with a 2 s timeout.
    await sleep(3000);
    for (const b of await Promise.all(bodies)) {
      if (!b) continue;
      const bytes = net.requests.find((r) => r.url === b.url)?.bytes ?? Buffer.byteLength(b.text);
      scripts.set(b.url, { url: b.url, text: b.text, bytes, profile });
    }
    if (profile === 'mobile') {
      for (const r of net.requests.filter((r) => r.type === 'Font')) fonts.set(r.url, r.bytes);
    }
    await ctx.close();
  }
  crawled = { scripts: [...scripts.values()], fonts };
  return crawled;
}

/* ── Stillness helpers ─────────────────────────────────────────────── */

/** Init script: counts every rAF callback while counting is on, and keeps the
 *  script that asked for it, so a failure names its culprit. */
function countFrames() {
  const raf = window.requestAnimationFrame.bind(window);
  const state = { counting: false, count: 0, sources: {} };
  window.__raf = state;
  window.requestAnimationFrame = (cb) => {
    const stack = state.counting ? new Error().stack || '' : '';
    return raf((t) => {
      if (state.counting) {
        state.count++;
        const line = stack.split('\n').slice(2).find((l) => /https?:\/\//.test(l)) || '?';
        const src = (line.match(/https?:\/\/[^\s)]+/) || ['?'])[0].replace(/:\d+:\d+$/, '');
        state.sources[src] = (state.sources[src] || 0) + 1;
      }
      cb(t);
    });
  };
}

/**
 * Wait for the page's entrance to finish: fonts in, and no finite animation
 * still running (bounded). Entrances answer the page load and are allowed to
 * end; what 静 and reduced motion must stop is what never ends. Measuring
 * while a headline is still fading in would blame the wrong thing, and on a
 * throttled machine the entrance alone outlasts a fixed two-second wait.
 */
async function settle(page, max = 8000) {
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page
    .waitForFunction(
      () =>
        !document
          .getAnimations()
          .some((a) => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity),
      null,
      { timeout: max, polling: 250 },
    )
    .catch(() => {});
}

/** Press 静 the way a visitor would. Phones keep it in the menu. */
async function pressStillness(page, profile) {
  const selector = 'button[aria-label="Stillness: pause ambient motion"]';
  if (profile === 'mobile') {
    await page.click('button[aria-controls="mobile-menu"]');
    await page.waitForSelector(`#mobile-menu ${selector}`, { state: 'visible', timeout: 5000 });
    await page.click(`#mobile-menu ${selector}`);
  } else {
    await page.click(`header ${selector}`);
  }
  const state = await page.evaluate((selector) => {
    const buttons = [...document.querySelectorAll(selector)];
    return {
      motionAttr: document.documentElement.dataset.motion ?? null,
      pressed: buttons.map((b) => b.getAttribute('aria-pressed')).every((v) => v === 'true') ? 'true' : 'false',
      stored: (() => {
        try {
          return localStorage.getItem('motion');
        } catch {
          return null;
        }
      })(),
    };
  }, selector);
  if (profile === 'mobile') {
    await page.keyboard.press('Escape');
    await page.waitForSelector('#mobile-menu', { state: 'detached', timeout: 5000 }).catch(() => {});
  }
  return state;
}

/** After 2 s of quiet, count rAF callbacks for 2 s and list infinite animations. */
async function measureIdle(page) {
  await sleep(2000);
  await page.evaluate(() => {
    window.__raf.count = 0;
    window.__raf.sources = {};
    window.__raf.counting = true;
  });
  await sleep(2000);
  return page.evaluate(() => {
    window.__raf.counting = false;
    const infinite = document
      .getAnimations()
      .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity)
      .map((a) => {
        const t = a.effect?.target;
        const cls = t ? String(t.className?.baseVal ?? t.className ?? '').slice(0, 60) : '';
        return `${a.animationName || a.constructor.name} on ${t?.tagName?.toLowerCase() ?? '?'}.${cls}`;
      });
    return {
      motionAttr: document.documentElement.dataset.motion ?? null,
      rafCallbacks: window.__raf.count,
      rafSources: window.__raf.sources,
      infinite: infinite.slice(0, 8),
      infiniteCount: infinite.length,
    };
  });
}

/* ── Gate implementations ───────────────────────────────────────────── */

const gates = {
  async 'lcp-mobile'() {
    const runs = await mobileProfile();
    const values = runs.map((r) => r.lcp ?? Infinity);
    const value = median(values);
    return {
      pass: value <= BUDGET.lcp,
      value: `${value} ms`,
      budget: `${BUDGET.lcp} ms`,
      detail: { runs: values, element: runs.map((r) => r.lcpElement) },
    };
  },

  async cls() {
    const runs = await mobileProfile();
    const value = median(runs.map((r) => r.cls));
    return { pass: value <= BUDGET.cls, value: String(value), budget: String(BUDGET.cls), detail: { runs: runs.map((r) => r.cls) } };
  },

  async longtasks() {
    const runs = await mobileProfile();
    const value = median(runs.map((r) => r.longtasks));
    return {
      pass: value <= BUDGET.longtasks,
      value: `${value} ms`,
      budget: `${BUDGET.longtasks} ms`,
      detail: { runs: runs.map((r) => r.longtasks) },
    };
  },

  async 'js-initial'() {
    const runs = await mobileProfile();
    // The first run is the honest cold load; later runs are just as cold
    // (fresh contexts), so take the median like the other mobile gates.
    const value = median(runs.map((r) => r.jsInitial));
    return { pass: value <= BUDGET.jsInitial, value: kb(value), budget: kb(BUDGET.jsInitial), detail: { runs: runs.map((r) => kb(r.jsInitial)) } };
  },

  async 'no-three'() {
    const { scripts } = await crawl();
    // Class names are minified away, but three's own messages keep the name.
    const hits = scripts.filter((s) => /three\.module|WebGLRenderer\b/.test(s.text));
    return {
      pass: hits.length === 0,
      value: hits.length ? `${hits.length} chunk(s)` : 'none',
      budget: 'none',
      detail: hits.map((h) => `${h.url.replace(BASE_URL, '')} (${kb(h.bytes)}, ${h.profile})`),
    };
  },

  async 'stage-size'() {
    const { scripts } = await crawl();
    const stage = scripts.find((s) => s.text.includes('__MANA_STAGE__'));
    if (!stage) return { pass: null, value: 'absent', budget: kb(BUDGET.stage), detail: 'no chunk carries __MANA_STAGE__ yet' };
    return {
      pass: stage.bytes <= BUDGET.stage,
      value: kb(stage.bytes),
      budget: kb(BUDGET.stage),
      detail: stage.url.replace(BASE_URL, ''),
    };
  },

  async fonts() {
    const { fonts } = await crawl();
    const total = [...fonts.values()].reduce((s, b) => s + b, 0);
    return {
      pass: total <= BUDGET.fonts,
      value: kb(total),
      budget: kb(BUDGET.fonts),
      detail: [...fonts.entries()].map(([u, b]) => `${u.replace(BASE_URL, '')} ${kb(b)}`),
    };
  },

  async axe() {
    const axePath = require.resolve('axe-core/axe.min.js');
    const found = new Map();
    for (const theme of ['dark', 'light']) {
      // Reduced motion so reveals have settled: a half-faded heading is a
      // contrast failure that no visitor ever actually reads.
      const ctx = await newContext({ theme, reduced: true });
      const page = await ctx.newPage();
      await page.goto(url('/'), { waitUntil: 'load', timeout: 120_000 });
      await sleep(1500);
      await page.addScriptTag({ path: axePath });
      for (const id of ['top', 'work', 'about', 'stack', 'path', 'hobby', 'contact', 'footer']) {
        const there = await page.evaluate((id) => {
          const el = id === 'footer' ? document.querySelector('footer') : document.getElementById(id);
          if (!el) return false;
          el.scrollIntoView({ block: 'center', behavior: 'instant' });
          return true;
        }, id);
        if (!there) continue;
        // The palette, the nav pill and in-view reveals all react to the
        // scroll; reading colours mid-change reports contrast nobody sees.
        await sleep(400);
        await settle(page, 5000);
        const violations = await page.evaluate(async () => {
          const res = await window.axe.run(document, { resultTypes: ['violations'] });
          return res.violations
            .filter((v) => v.impact === 'serious' || v.impact === 'critical')
            .map((v) => ({
              id: v.id,
              impact: v.impact,
              nodes: v.nodes.slice(0, 5).map((n) => ({
                target: n.target.join(' '),
                why: (n.any[0] || n.all[0] || n.none[0])?.message?.slice(0, 200),
              })),
            }));
        });
        for (const v of violations) {
          for (const n of v.nodes) {
            const key = `${theme}|${v.id}|${n.target}`;
            if (!found.has(key)) found.set(key, { theme, at: id, rule: v.id, impact: v.impact, ...n });
          }
        }
      }
      await ctx.close();
    }
    return {
      pass: found.size === 0,
      value: `${found.size} serious/critical`,
      budget: '0',
      detail: [...found.values()],
    };
  },

  async 'still-idle'() {
    const results = [];
    for (const profile of ['desktop', 'mobile']) {
      for (const mode of ['still', 'reduced']) {
        // Reduced motion comes from the context. 静 is reached the way a
        // visitor reaches it: by pressing the toggle in the nav (or, on a
        // phone, in the menu), on a page that was moving until then.
        const ctx = await newContext({ profile, reduced: mode === 'reduced' });
        await ctx.addInitScript(countFrames);
        const page = await ctx.newPage();
        await page.goto(url('/'), { waitUntil: 'load', timeout: 120_000 });
        await settle(page);

        let toggle = null;
        if (mode === 'still') {
          toggle = await pressStillness(page, profile);
          await settle(page);
        }

        const idle = await measureIdle(page);
        const r = { profile, mode, toggle, ...idle };
        r.pass =
          r.infiniteCount === 0 &&
          r.rafCallbacks <= BUDGET.rafCallbacks &&
          (mode !== 'still' || (toggle.motionAttr === 'still' && toggle.pressed === 'true'));

        if (mode === 'still') {
          // A preference, so it must survive a reload, and the reloaded page
          // must be just as quiet as the one where it was pressed.
          await page.reload({ waitUntil: 'load', timeout: 120_000 });
          await settle(page);
          const again = await measureIdle(page);
          r.afterReload = again;
          r.pass =
            r.pass &&
            again.motionAttr === 'still' &&
            again.infiniteCount === 0 &&
            again.rafCallbacks <= BUDGET.rafCallbacks;
        }
        results.push(r);
        await ctx.close();
      }
    }
    const failed = results.filter((r) => !r.pass);
    const fmt = (r) =>
      `${r.profile}/${r.mode}: ${r.rafCallbacks} rAF, ${r.infiniteCount} inf` +
      (r.afterReload ? ` (reload: ${r.afterReload.motionAttr}, ${r.afterReload.rafCallbacks} rAF)` : '');
    return {
      pass: failed.length === 0,
      value: results.map(fmt).join('; '),
      budget: `<= ${BUDGET.rafCallbacks} rAF, 0 infinite`,
      detail: results,
    };
  },

  async keyboard() {
    const results = [];
    for (const reduced of [false, true]) {
      const ctx = await newContext({ reduced });
      const page = await ctx.newPage();
      await page.goto(url('/'), { waitUntil: 'load', timeout: 120_000 });
      await sleep(1000);

      await page.keyboard.press('Tab');
      const first = await page.evaluate(() => ({
        text: document.activeElement?.textContent?.trim() ?? '',
        href: document.activeElement?.getAttribute('href') ?? '',
      }));
      const skipFirst = /skip to content/i.test(first.text);

      await page.keyboard.press('Enter');
      const inMain = await page
        .waitForFunction(
          () => {
            const main = document.getElementById('main');
            const a = document.activeElement;
            return Boolean(main && a && (a === main || main.contains(a)));
          },
          null,
          { timeout: 2500 },
        )
        .then(() => true)
        .catch(() => false);

      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await sleep(400);
      await page.click('nav[aria-label="Primary"] a[href$="#stack"]');
      await sleep(2000);
      const afterStack = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
      results.push({
        reduced,
        firstTab: first,
        skipFirst,
        skipLandsInMain: inMain,
        stackFocus: afterStack,
        pass: skipFirst && inMain && afterStack === 'stack',
      });
      await ctx.close();
    }
    return {
      pass: results.every((r) => r.pass),
      value: results.map((r) => `${r.reduced ? 'reduced' : 'motion'}: skip=${r.skipFirst && r.skipLandsInMain} stack=${r.stackFocus}`).join('; '),
      budget: 'skip link first + into #main; #stack focused',
      detail: results,
    };
  },

  async resilience() {
    const results = [];
    for (const profile of ['desktop', 'mobile']) {
      const ctx = await newContext({ profile });
      const page = await ctx.newPage();
      const aborted = [];
      await page.route(/\.js(\?|$)/, async (route) => {
        let res;
        try {
          res = await route.fetch();
        } catch {
          return route.abort();
        }
        const body = await res.text();
        if (/PipelineBench|__MANA_STAGE__/.test(body)) {
          aborted.push(route.request().url().replace(BASE_URL, ''));
          return route.abort();
        }
        // The fetched body is already decoded, so the encoding headers must go.
        const headers = { ...res.headers() };
        delete headers['content-encoding'];
        delete headers['content-length'];
        return route.fulfill({ status: res.status(), headers, body });
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 160)));
      await page.goto(url('/'), { waitUntil: 'load', timeout: 120_000 });
      await sleep(1500);
      let broken = false;
      const check = async () => {
        const text = await page.evaluate(() => document.body?.innerText ?? '');
        if (/Application error/i.test(text)) broken = true;
      };
      await check();
      await scrollThrough(page, 250);
      await sleep(3000);
      await check();
      results.push({ profile, aborted, broken, pageErrors: errors.slice(0, 5) });
      await ctx.close();
    }
    const broken = results.some((r) => r.broken);
    const abortedAny = results.some((r) => r.aborted.length);
    return {
      pass: !broken,
      value: broken ? "'Application error' shown" : abortedAny ? 'survived' : 'no matching chunks to abort',
      budget: 'page survives',
      detail: results,
    };
  },

  async honesty() {
    const host = new URL(BASE_URL).hostname;
    if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
      return { pass: null, value: 'skipped', budget: 'no delivered:true', detail: `will not POST to a non-local site (${host})` };
    }
    // next start reads .env files itself; if one configures a provider, this
    // POST would put a real message in the owner's inbox. Refuse instead.
    const configured = ['.env', '.env.local', '.env.production', '.env.production.local'].filter((f) => {
      try {
        return /^\s*(RESEND_API_KEY|CONTACT_TO_EMAIL)\s*=\s*\S/m.test(fs.readFileSync(path.join(ROOT, f), 'utf8'));
      } catch {
        return false;
      }
    });
    if (configured.length) {
      return { pass: null, value: 'skipped', budget: 'no delivered:true', detail: `mail provider configured in ${configured.join(', ')}` };
    }
    const res = await fetch(url('/api/contact'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `203.0.113.${Math.floor(Math.random() * 200) + 1}` },
      body: JSON.stringify({
        name: 'Audit Gate',
        email: 'audit@example.com',
        message: '[audit] honesty gate. No mail provider is configured, so this must not be reported as delivered.',
        website: '',
      }),
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* not JSON: a failure in its own right */
    }
    return {
      pass: json !== null && json.delivered !== true,
      value: `${res.status} ${json ? JSON.stringify(json).slice(0, 120) : 'non-JSON'}`,
      budget: 'JSON, no delivered:true',
      detail: { status: res.status, body: json ?? text.slice(0, 200) },
    };
  },

  async 'palette-parity'() {
    const ts = require('typescript');
    const src = fs.readFileSync(path.join(ROOT, 'src/lib/palettes.ts'), 'utf8');
    const js = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'audit-')), 'palettes.mjs');
    fs.writeFileSync(tmp, js);
    const { PALETTES } = await import(pathToFileURL(tmp).href);

    const read = (f) =>
      fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const channel = (body, name) => {
      const m = body.match(new RegExp(`--${name}\\s*:\\s*(\\d+)`));
      return m ? Number(m[1]) : null;
    };

    /** Every rule that sets all six channels, classified by theme/section/kind. */
    const pairsIn = (file) => {
      const out = [];
      const css = read(file);
      for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const selector = m[1].trim().replace(/\s+/g, ' ');
        const body = m[2];
        const ch = ['c1r', 'c1g', 'c1b', 'c2r', 'c2g', 'c2b'].map((n) => channel(body, n));
        if (ch.some((v) => v === null)) continue;
        const theme = /\[data-theme='dark'\]/.test(selector) ? 'dark' : 'light';
        const palette = selector.match(/\[data-palette='(\w+)'\]/);
        const section = selector.match(/\[data-section='(\w+)'\]/);
        const kind = palette ? 'subtree' : 'chrome';
        const id = palette ? palette[1] : section ? section[1] : 'prologue';
        out.push({ file, selector, theme, kind, id, pair: [ch.slice(0, 3), ch.slice(3)] });
      }
      return out;
    };

    const found = [...pairsIn('src/app/globals.css'), ...pairsIn('src/styles/palettes.css')];
    const mismatches = [];
    for (const f of found) {
      const expected = PALETTES[f.theme]?.[f.id];
      if (!expected) {
        mismatches.push(`${f.file}: ${f.selector} names unknown section '${f.id}'`);
        continue;
      }
      if (JSON.stringify(expected) !== JSON.stringify(f.pair)) {
        mismatches.push(`${f.file}: ${f.selector} is ${JSON.stringify(f.pair)}, palettes.ts says ${JSON.stringify(expected)}`);
      }
    }
    const missing = [];
    for (const theme of ['dark', 'light']) {
      for (const id of Object.keys(PALETTES[theme])) {
        if (!found.some((f) => f.theme === theme && f.id === id && f.kind === 'chrome')) {
          missing.push(`chrome ${theme}/${id}`);
        }
        if (!found.some((f) => f.theme === theme && f.id === id && f.kind === 'subtree')) {
          missing.push(`subtree ${theme}/${id}`);
        }
      }
    }
    return {
      pass: mismatches.length === 0 && missing.length === 0,
      value: `${found.length} pairs checked, ${mismatches.length} mismatched, ${missing.length} missing`,
      budget: 'all equal, none missing',
      detail: { mismatches, missing },
    };
  },
};

/* ── Screenshots (--shots) ──────────────────────────────────────────── */

async function shots() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(OUT_DIR, 'shots', stamp);
  fs.mkdirSync(dir, { recursive: true });
  const sections = ['top', 'work', 'about', 'stack', 'path', 'hobby', 'contact'];
  let n = 0;
  for (const theme of ['dark', 'light']) {
    for (const profile of ['desktop', 'mobile']) {
      for (const motion of ['motion', 'reduced']) {
        const ctx = await newContext({ profile, theme, reduced: motion === 'reduced', dpr: profile === 'mobile' ? 2 : 1 });
        const page = await ctx.newPage();
        await page.goto(url('/'), { waitUntil: 'load', timeout: 120_000 });
        await sleep(1500);
        const { width, height } = PROFILES[profile].viewport;
        for (const id of sections) {
          const there = await page.evaluate((id) => {
            const el = document.getElementById(id);
            el?.scrollIntoView({ block: 'start', behavior: 'instant' });
            return Boolean(el);
          }, id);
          if (!there) continue;
          await sleep(1300);
          await page.screenshot({ path: path.join(dir, `${id}-${theme}-${width}x${height}-${motion}.png`) });
          n++;
        }
        await ctx.close();
      }
    }
  }
  return { dir: path.relative(ROOT, dir), count: n };
}

/* ── Run ────────────────────────────────────────────────────────────── */

const report = {
  baseUrl: BASE_URL,
  startedAt: new Date().toISOString(),
  commit: (() => {
    try {
      return execSync('git rev-parse --short HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      return null;
    }
  })(),
  gates: [],
};

let exitCode = 0;
try {
  if (SERVE) await startServer();
  else if (!(await reachable(BASE_URL, 5000))) {
    console.error(`audit: nothing answering at ${BASE_URL}. Start the site, or pass --serve to run next start from .next.`);
    process.exit(2);
  }

  browser = await chromium.launch({ args: LAUNCH_ARGS });

  for (const id of GATES) {
    if (!selected.includes(id)) {
      if (skippedByFlag.includes(id)) report.gates.push({ id, status: 'skip', value: 'skipped by --only', budget: '', detail: null });
      continue;
    }
    const t0 = Date.now();
    process.stdout.write(`  … ${id}\r`);
    let result;
    try {
      result = await gates[id]();
    } catch (err) {
      result = { pass: false, value: 'error', budget: '', detail: String(err?.stack || err).slice(0, 1200) };
    }
    const status = result.pass === null ? 'skip' : result.pass ? 'pass' : 'fail';
    if (status === 'fail') exitCode = 1;
    report.gates.push({ id, status, value: result.value, budget: result.budget, ms: Date.now() - t0, detail: result.detail });
    const mark = status === 'pass' ? 'PASS' : status === 'fail' ? 'FAIL' : 'skip';
    console.log(`  ${mark}  ${id.padEnd(15)} ${String(result.value).padEnd(28)} budget ${result.budget}`);
  }

  if (SHOTS) {
    const s = await shots();
    report.shots = s;
    console.log(`  shots  ${s.count} PNGs in ${s.dir}`);
  }
} catch (err) {
  console.error(`audit: ${err?.message || err}`);
  exitCode = 2;
} finally {
  await browser?.close().catch(() => {});
  stopServer();
  report.finishedAt = new Date().toISOString();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
  const failed = report.gates.filter((g) => g.status === 'fail').map((g) => g.id);
  console.log(
    failed.length
      ? `\naudit: ${failed.length} gate(s) failed: ${failed.join(', ')}. Details in .audit/report.json`
      : `\naudit: ${report.gates.filter((g) => g.status === 'pass').length} gate(s) passed. Report in .audit/report.json`,
  );
}
process.exit(exitCode);
