/**
 * Captures the real, live CarbonZero deployment so the grimoire spread shows
 * Mishal's own UI rather than a generated placeholder.
 *
 * Two rules the spec is strict about, and why:
 *  - No stock photography is ever committed. CarbonZero uses Unsplash images
 *    below the fold; before each shot we assert that no visible <img> whose
 *    currentSrc mentions unsplash intersects the viewport, and move if one does.
 *  - sharp is not installed (node_modules is a shared symlink we must not
 *    write to), so the webp encode happens inside Chromium itself: the PNG is
 *    drawn to a canvas and re-encoded with toDataURL('image/webp', q). Same
 *    encoder Chrome ships, no new dependency.
 *
 * Usage: npm run capture:work
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const TARGET = 'https://carbon-footprint-calc-v5.vercel.app/';
const OUT_DIR = path.resolve(process.cwd(), 'public/work');
const WIDTH = 1440;
const HEIGHT = 900;
const QUALITY = 0.78;
const MAX_BYTES = 200 * 1024;

async function loadPlaywright() {
  let mod;
  try {
    mod = await import('playwright');
  } catch {
    mod = await import('/opt/node-tools/node_modules/playwright/index.js');
  }
  // playwright is CJS; under some resolutions the namespace only carries
  // `default`, so chromium hides one level down.
  return mod.chromium ? mod : mod.default;
}

/** True when a visible stock photo is intersecting the viewport. */
function stockInView() {
  return Array.from(document.images).some((img) => {
    const src = img.currentSrc || img.src || '';
    if (!/unsplash|pexels|istock|shutterstock/i.test(src)) return false;
    const r = img.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return false;
    const style = getComputedStyle(img);
    if (style.visibility === 'hidden' || style.display === 'none') return false;
    return r.bottom > 0 && r.top < window.innerHeight;
  });
}

async function toWebp(page, pngBuffer) {
  const dataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`;
  // Re-encode at successively lower quality until it fits the budget. Most
  // screenshots clear 200 KB on the first pass; the loop is the safety net.
  for (let q = QUALITY; q >= 0.4; q -= 0.08) {
    const b64 = await page.evaluate(
      async ([url, quality, width]) => {
        const img = new Image();
        img.src = url;
        await img.decode();
        const scale = width / img.naturalWidth;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/webp', quality).split(',')[1];
      },
      [dataUrl, q, WIDTH],
    );
    const buf = Buffer.from(b64, 'base64');
    if (buf.byteLength <= MAX_BYTES) return { buf, q };
  }
  throw new Error('could not get the capture under 200 KB');
}

const pw = await loadPlaywright();
const browser = await pw.chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();
// A second page is the encoder sandbox — it never navigates to the target, so
// the capture it re-encodes cannot be tampered with by the captured site.
const encoder = await ctx.newPage();
await encoder.goto('about:blank');

await mkdir(OUT_DIR, { recursive: true });

try {
  await page.goto(TARGET, { waitUntil: 'networkidle', timeout: 60_000 });

  // (a) the data intro, once its count-up has settled.
  await page.waitForTimeout(6_000);
  if (await page.evaluate(stockInView)) {
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(800);
  }
  const introPng = await page.screenshot({ type: 'png' });
  const intro = await toWebp(encoder, introPng);
  await writeFile(path.join(OUT_DIR, 'carbonzero-intro.webp'), intro.buf);
  console.log(`carbonzero-intro.webp  ${(intro.buf.byteLength / 1024).toFixed(0)} KB  q=${intro.q.toFixed(2)}`);

  // (b) the main page, after the intro is skipped.
  for (const label of ['skip', 'Skip', 'Explore', 'Enter', 'Calculate']) {
    const btn = page.getByText(label, { exact: false }).first();
    if (await btn.count().catch(() => 0)) {
      await btn.click({ timeout: 2_000 }).catch(() => {});
      break;
    }
  }
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(3_000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1_500);

  // Walk down in small steps until the viewport is free of stock photography.
  let offset = 0;
  for (let i = 0; i < 12 && (await page.evaluate(stockInView)); i += 1) {
    offset += 220;
    await page.evaluate((y) => window.scrollTo(0, y), offset);
    await page.waitForTimeout(600);
  }
  if (await page.evaluate(stockInView)) {
    throw new Error('every candidate position held stock photography — refusing to commit it');
  }

  const homePng = await page.screenshot({ type: 'png' });
  const home = await toWebp(encoder, homePng);
  await writeFile(path.join(OUT_DIR, 'carbonzero-home.webp'), home.buf);
  console.log(`carbonzero-home.webp   ${(home.buf.byteLength / 1024).toFixed(0)} KB  q=${home.q.toFixed(2)}`);

  const captured = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  console.log(`\ncapturedAt for src/lib/work.ts: '${captured}'`);
  console.log(`dimensions: ${WIDTH}x${Math.round((HEIGHT / WIDTH) * WIDTH)}`);
} finally {
  await browser.close();
}
