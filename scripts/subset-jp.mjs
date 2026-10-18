#!/usr/bin/env node
/**
 * Builds src/app/fonts/ShipporiMinchoB1-800-subset.woff2: every Japanese
 * character the site prints, and nothing else.
 *
 * Why a subset: the page sets Japanese everywhere from the 300px stroke-order
 * kanji down to 11px katakana credits, and until now that fell to whatever
 * Mincho the OS had (none on Android or Windows without the JP pack). The full
 * Shippori Mincho B1 ExtraBold is ~10 MB; the ~100 characters actually used
 * subset to a few tens of kB.
 *
 * Which characters: anything in the CJK punctuation/kana, CJK ideograph or
 * fullwidth blocks found in src/**\/*.{ts,tsx,css}, plus EXTRAS — the slates
 * and states other packages render (第壱話…, 次回予告, エンディング, つづく,
 * 召喚失敗, 静). Hangul is deliberately left out and stays on the system font.
 *
 * Source: google/fonts, ofl/shipporiminchob1 (SIL Open Font License 1.1, see
 * src/app/fonts/OFL-ShipporiMinchoB1.txt). Downloaded to the OS temp dir and
 * never committed.
 *
 * Usage:
 *   node scripts/subset-jp.mjs          rebuild the subset   (npm run fonts:jp)
 *   node scripts/subset-jp.mjs --check  exit 1 if a character the source uses
 *                                       is missing from the committed subset
 * Needs: python3 with fontTools + brotli (pyftsubset).
 */
import { readFile, readdir, writeFile, stat, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'src/app/fonts/ShipporiMinchoB1-800-subset.woff2');
const SRC =
  'https://raw.githubusercontent.com/google/fonts/main/ofl/shipporiminchob1/ShipporiMinchoB1-ExtraBold.ttf';
const CACHE = path.join(os.tmpdir(), 'ShipporiMinchoB1-ExtraBold.ttf');
const BUDGET = 35 * 1024;
const EXTRAS = '第壱弐参肆話次回予告エンディング序つづく召喚失敗静';
// U+3000–30FF CJK punctuation, hiragana, katakana · U+3400–9FFF ideographs ·
// U+FF00–FFEF fullwidth forms.
const JP = /[　-ヿ㐀-鿿＀-￯]/gu;
// Characters the source only ever splits on, never typesets. The halfwidth
// middle dot is a delimiter in the hero's kana lockup: a visitor may type it
// between name parts, but the font prints the fullwidth one. Shippori has no
// glyph for it, so without this the build would abort on a character that is
// never drawn.
const NEVER_PRINTED = new Set(['\uFF65']);

async function sourceFiles(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && /\.(tsx?|css)$/.test(e.name))
    .map((e) => path.join(e.parentPath ?? e.path, e.name));
}

async function usedChars() {
  const set = new Set(EXTRAS);
  for (const file of await sourceFiles(path.join(root, 'src'))) {
    const text = await readFile(file, 'utf8');
    for (const m of text.matchAll(JP)) if (!NEVER_PRINTED.has(m[0])) set.add(m[0]);
  }
  return [...set].sort();
}

function cmapOf(file) {
  const py = [
    'import sys',
    'from fontTools.ttLib import TTFont',
    'f = TTFont(sys.argv[1])',
    "print(''.join(chr(c) for c in f.getBestCmap()))",
  ].join('\n');
  return new Set(
    execFileSync('python3', ['-c', py, file], { encoding: 'utf8' }).trim(),
  );
}

const chars = await usedChars();

if (process.argv.includes('--check')) {
  if (!existsSync(OUT)) {
    console.error(`missing ${path.relative(root, OUT)} — run npm run fonts:jp`);
    process.exit(1);
  }
  const have = cmapOf(OUT);
  const missing = chars.filter((c) => !have.has(c));
  if (missing.length) {
    console.error(
      `${missing.length} character(s) used in src/ are not in the subset: ${missing.join(' ')}\n` +
        'Run `npm run fonts:jp` and commit the regenerated woff2.',
    );
    process.exit(1);
  }
  console.log(`ok — all ${chars.length} Japanese characters are in the subset`);
  process.exit(0);
}

if (!existsSync(CACHE)) {
  console.log('downloading', SRC);
  const res = await fetch(SRC);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${SRC}`);
  await writeFile(CACHE, Buffer.from(await res.arrayBuffer()));
}

// A character the font itself lacks can never be subset in, and --check would
// then fail forever. Say so now instead.
const inFont = cmapOf(CACHE);
const absent = chars.filter((c) => !inFont.has(c));
if (absent.length) {
  console.error(`not in Shippori Mincho B1 at all: ${absent.join(' ')}`);
  process.exit(1);
}

const tmp = await mkdtemp(path.join(os.tmpdir(), 'subset-jp-'));
try {
  const textFile = path.join(tmp, 'chars.txt');
  await writeFile(textFile, chars.join(''));
  execFileSync(
    'pyftsubset',
    [
      CACHE,
      `--text-file=${textFile}`,
      '--flavor=woff2',
      "--layout-features=*",
      '--no-hinting',
      '--desubroutinize',
      `--output-file=${OUT}`,
    ],
    { stdio: 'inherit' },
  );
} finally {
  await rm(tmp, { recursive: true, force: true });
}

const { size } = await stat(OUT);
console.log(
  `wrote ${path.relative(root, OUT)}  ${chars.length} chars  ${size} bytes (${(size / 1024).toFixed(1)} KB)`,
);
if (size > BUDGET) {
  console.error(`over budget: ${size} > ${BUDGET} bytes`);
  process.exit(1);
}
