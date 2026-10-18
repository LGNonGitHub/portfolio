import localFont from 'next/font/local';

/**
 * The two faces the episode title cards add. Each does exactly one job.
 *
 * displayCond — Bricolage Grotesque pinned to its display optical size and
 * fully condensed width (built by scripts/build-display-font.py). It sets the
 * ink half of every episode headline; the italic answer stays Instrument
 * Serif. Preloaded because a headline that reflows from a fallback at 10rem is
 * the most visible font swap on the page.
 *
 * jp — Shippori Mincho B1 ExtraBold, subset to the Japanese this site actually
 * prints (scripts/subset-jp.mjs). Not preloaded: no Japanese sits in the
 * first viewport's critical text, and the stroke-order kanji wait for
 * document.fonts.load() before they draw anyway. adjustFontFallback is off
 * because next/font's metric matching is computed against Arial, which has no
 * kana or kanji — the "adjusted" fallback would only mis-size the system
 * Mincho that renders in the meantime.
 *
 * Both are SIL Open Font License 1.1; texts sit beside the woff2 files.
 */
export const displayCond = localFont({
  src: '../app/fonts/BricolageCondensed-Display.woff2',
  variable: '--font-display-cond',
  weight: '600 800',
  display: 'swap',
});

export const jp = localFont({
  src: '../app/fonts/ShipporiMinchoB1-800-subset.woff2',
  variable: '--font-jp',
  weight: '800',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  fallback: ['Hiragino Mincho ProN', 'Yu Mincho', 'serif'],
});
