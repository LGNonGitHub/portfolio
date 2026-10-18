/**
 * The season's running order, keyed by section index.
 *
 * Each section opens on an episode title card, and the slate is the line an
 * anime's own card would carry: 第壱話 to 第肆話 in the formal numerals a
 * broadcast slate uses (壱弐参肆, not 一二三四), then the ending and the
 * next-episode preview. Hobby is the ED, so it gets エンディング rather than a
 * fifth episode number; Contact is 次回予告 and is rendered by the finale,
 * not by SectionHeader.
 *
 * Every character here must be in the Shippori Mincho subset —
 * `node scripts/subset-jp.mjs --check` fails the build step if one is not.
 */
export type Episode = {
  /** The Japanese slate, set in Mincho. */
  slate: string;
  /** The English kicker beside it, set in mono caps. */
  kicker: string;
};

export const EPISODES = {
  '01': { slate: '第壱話', kicker: 'Episode 01' },
  '02': { slate: '第弐話', kicker: 'Episode 02' },
  '03': { slate: '第参話', kicker: 'Episode 03' },
  '04': { slate: '第肆話', kicker: 'Episode 04' },
  '05': { slate: 'エンディング', kicker: 'Ending' },
  '06': { slate: '次回予告', kicker: 'Next episode' },
} as const satisfies Record<string, Episode>;

export type EpisodeIndex = keyof typeof EPISODES;

/**
 * The episode for a section index, or undefined for unnumbered sections
 * (Process and the like), which then render without a slate. Accepts '1' as
 * well as '01' so a caller's formatting cannot silently drop the card.
 */
export function episodeFor(index: string): Episode | undefined {
  const key = index.trim().padStart(2, '0');
  return key in EPISODES ? EPISODES[key as EpisodeIndex] : undefined;
}
