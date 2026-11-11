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
  /** Where the picture came from, when it is not a capture of a live site. */
  note?: string;
};


/** The day scripts/capture-work.mjs last ran against the live deployment. */
export const capturedAt = '18 Oct 2026';

/** The provenance line under a picture. */
export const shotNote = (shot: Shot) => shot.note ?? `captured ${capturedAt}`;

/** The line under a spread's capture sheet. */
export const sheetSource: Record<string, string> = {
  carbonzero: `carbon-footprint-calc-v5.vercel.app · captured ${capturedAt}`,
  auvren: 'Screenshots from the Windows prototype',
};

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
  // Supplied by Mishal from the prototype; nothing here is a mock-up.
  auvren: [
    {
      src: '/work/auvren-main.webp',
      w: 1440,
      h: 900,
      alt: 'Auvren’s main window: a blue particle orb, the last request “set a timer for ten minutes for the pasta” in grey, the reply “Timer set for ten minutes, sir. I shall tell you when the pasta is done.” in light blue, and a text box reading “how much battery is left?”.',
      caption: 'The main window: the orb, your last request and its reply',
      note: 'from the prototype',
    },
    {
      src: '/work/auvren-intro.webp',
      w: 1440,
      h: 900,
      alt: 'Auvren’s intro: concentric blue rings around a glowing core, the name AUVREN and the word LISTENING beneath it.',
      caption: 'The intro, when the wake word or hotkey summons it',
      note: 'from the prototype',
    },
    {
      src: '/work/auvren-settings.webp',
      w: 1440,
      h: 900,
      alt: 'Auvren’s settings panel: an optional Fish Audio key, connection status for Claude Code CLI and the local server, the user’s name and honorific, and the server port and uptime.',
      caption: 'Settings: the optional voice key, connection status and how it addresses you',
      note: 'from the prototype',
    },
    {
      src: '/work/auvren-dashboard.webp',
      w: 1389,
      h: 868,
      alt: 'Auvren’s run dashboard with tabs for runs, sessions, memory, specs, projects and usage, empty because nothing has run yet.',
      caption: 'The run dashboard for work handed to Claude Code, before anything has run',
      note: 'from the prototype',
    },
    {
      src: '/work/auvren-states.webp',
      w: 720,
      h: 190,
      alt: 'Six status icons labelled asleep, awake, thinking, speaking, muted and down.',
      caption: 'Its six states: asleep, awake, thinking, speaking, muted and down',
      note: 'from the prototype',
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
