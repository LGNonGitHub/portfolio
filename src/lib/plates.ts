import { credits } from "@/lib/content";

/**
 * The five character plates, keyed by the image path the sections already
 * pass to SectionVisual. One table, so a plate's crop, ground and cut are
 * decided once and every place that shows it agrees.
 *
 * `ground` describes the artwork, not the page. Work and About were painted
 * on dark grounds and print as they are. Stack, Path and Contact were drawn
 * on white, and a white rectangle on a dark page is what made the old plates
 * look pasted on — those get printed onto a deep tint of the section colour
 * instead (multiply), so the paper becomes ink and the linework survives.
 *
 * `focus` is the object-position for the crop. Each one was checked by
 * screenshot at desktop and phone widths so no face is cut off; change only
 * this value if a crop needs moving.
 *
 * `cut` is the series' own reveal: Black Clover's anti-magic slash, a One For
 * All bolt, a circle cast from the wand tip in the Wistoria art, SAO's system window
 * drawing in rows, and a flower opening.
 */
export type PlateSection = "work" | "about" | "stack" | "path" | "contact";
export type PlateGround = "dark" | "light";
export type PlateCut = "slash" | "bolt" | "iris" | "scan" | "bloom";
export type PlateRatio = "3/2" | "4/5";

export type PlateConfig = {
  section: PlateSection;
  /** Must match a `credits.series[].title` exactly — that is the join. */
  series: string;
  /** Natural size of the source file. */
  w: number;
  h: number;
  ground: PlateGround;
  ratio: PlateRatio;
  focus: string;
  cut: PlateCut;
  /** Where the iris cut opens from, as a CSS position inside the plate. */
  irisAt?: string;
};

export const PLATES: Record<string, PlateConfig> = {
  "/art/work.webp": {
    section: "work",
    series: "Black Clover",
    w: 1400,
    h: 952,
    ground: "dark",
    ratio: "3/2",
    focus: "50% 30%",
    cut: "slash",
  },
  "/art/about.webp": {
    section: "about",
    series: "My Hero Academia",
    w: 900,
    h: 1000,
    ground: "dark",
    ratio: "4/5",
    focus: "50% 30%",
    cut: "bolt",
  },
  "/art/stack.webp": {
    section: "stack",
    series: "Wistoria: Wand and Sword",
    w: 1120,
    h: 1260,
    ground: "light",
    ratio: "4/5",
    focus: "50% 25%",
    cut: "iris",
    irisAt: "62% 48%",
  },
  "/art/path.webp": {
    section: "path",
    series: "Sword Art Online",
    w: 1400,
    h: 944,
    ground: "light",
    ratio: "3/2",
    focus: "50% 30%",
    cut: "scan",
  },
  "/art/contact.webp": {
    section: "contact",
    series: "The Fragrant Flower Blooms with Dignity",
    w: 1400,
    h: 920,
    ground: "light",
    ratio: "3/2",
    focus: "40% 40%",
    cut: "bloom",
  },
};

export type PlateCredit = (typeof credits.series)[number];

/**
 * The plate for a series, by title. The Hobby list shows all five beside the
 * names, which is the one place the art and the series it comes from are read
 * together; everywhere else a section looks its plate up by file.
 */
export function plateSrcForSeries(series: string): string | undefined {
  return Object.keys(PLATES).find((src) => PLATES[src].series === series);
}

export function plateFor(src?: string): PlateConfig | undefined {
  return src ? PLATES[src] : undefined;
}

/**
 * The credit printed under a plate. Read from the same `credits` list the
 * footer uses rather than restated here, so there is one place to correct an
 * attribution and the caption can never disagree with it.
 */
export function creditFor(series: string): PlateCredit | undefined {
  return credits.series.find((s) => s.title === series);
}

/** '3/2' → 1.5, for the CSS width cap (52vh × ratio). */
export function ratioValue(ratio: PlateRatio): number {
  const [w, h] = ratio.split("/").map(Number);
  return w / h;
}
