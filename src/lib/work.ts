/**
 * Everything the grimoire spreads need that is *about* a project rather than
 * part of it. content.ts stays the single source of project copy; this file
 * only adds the evidence — real captures with the date they were taken, and
 * the pipeline lanes transcribed from PictoTrack's own description.
 *
 * Nothing here is invented. If a capture is missing the spread renders the
 * typographic block alone rather than substituting artwork.
 */

export type Shot = {
  src: string;
  w: number;
  h: number;
  alt: string;
  caption: string;
};

/** The day scripts/capture-work.mjs last ran against the live deployment. */
export const capturedAt = '18 Oct 2026';

export const shots: Record<string, Shot[]> = {
  carbonzero: [
    {
      src: '/work/carbonzero-home.webp',
      w: 1440,
      h: 900,
      alt:
        'CarbonZero’s overview screen: the headline “Our planet. Our responsibility.” beside a dotted globe, with live Mauna Loa CO₂, temperature anomaly and 1.5 °C budget readouts.',
      caption: 'Overview: live readouts and the reduction-plan entry points',
    },
    {
      src: '/work/carbonzero-intro.webp',
      w: 1440,
      h: 900,
      alt:
        'CarbonZero’s data intro: a CO₂ curve annotated with 1958, 1988 and 2015, counting up to a 2050 net-zero pathway.',
      caption: 'The data intro, counted up and annotated, before it cuts away',
    },
  ],
};

export type Lane = { lane: string; steps: string[] };

/**
 * Taken verbatim from projects.pictotrack.description — OCR first, EXIF as the
 * fallback, both ending in a reverse geocode and a plotted map. The bench below
 * the diagram runs the fallback route for real, in the browser.
 */
export const pipeline: Record<string, Lane[]> = {
  pictotrack: [
    {
      lane: 'OCR route',
      steps: ['Greyscale', 'Otsu threshold', 'Dilation', 'Tesseract OCR', 'Nominatim geocode'],
    },
    {
      lane: 'EXIF fallback',
      steps: ['GPS IFD', 'DMS → decimal', '± hemisphere'],
    },
    {
      lane: 'Result',
      steps: ['Reverse geocode', 'gmplot map'],
    },
  ],
};

/** 壱 弐 — the spread numerals, in the order the projects are listed. */
export const numerals = ['壱', '弐', '参', '肆'] as const;
