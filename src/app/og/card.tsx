import { site } from '@/lib/content';

/**
 * The shared furniture for every share card.
 *
 * WHY a module rather than two copies: the cards are the site seen at
 * thumbnail size, so the ground, the rule and the slate have to match each
 * other exactly or a shared link reads as a different site each time.
 */

/** Page ground, --bg dark. Opaque: a transparent PNG goes black-on-black in
 *  some clients and white-on-white in others. */
export const GROUND = '#08060E';
export const INK = '#EDEBF3';
export const MUTED = '#9E98B0';
export const SIZE = { width: 1200, height: 630 } as const;

/** Section pairs, copied from src/lib/palettes.ts (dark theme). The cards
 *  cannot import the RGB tuples and stay readable, so the hex is spelled out;
 *  these are the same numbers. */
export const PAIRS = {
  prologue: ['#3CD68C', '#A276FF'],
  work: ['#F2555F', '#E8B94A'],
} as const;

export const fonts = async () => {
  const load = (f: string) =>
    fetch(new URL(`./${f}`, import.meta.url)).then((r) => r.arrayBuffer());
  const [display, serif, mincho] = await Promise.all([
    load('Bricolage-Bold.ttf'),
    load('InstrumentSerif-Italic.ttf'),
    load('Mincho-Kanji.ttf'),
  ]);
  return [
    { name: 'Display', data: display, weight: 700 as const, style: 'normal' as const },
    { name: 'Serif', data: serif, weight: 400 as const, style: 'italic' as const },
    { name: 'Mincho', data: mincho, weight: 800 as const, style: 'normal' as const },
  ];
};

/** The episode slate, the same lockup SectionHeader draws on the page. */
export function Slate({
  slate,
  kicker,
  colour,
}: {
  slate: string;
  kicker: string;
  colour: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <span style={{ fontFamily: 'Mincho', fontSize: 34, color: colour }}>
        {slate}
      </span>
      <span style={{ width: 64, height: 2, background: colour, opacity: 0.6 }} />
      <span
        style={{
          fontFamily: 'Display',
          fontSize: 20,
          letterSpacing: '0.24em',
          color: MUTED,
        }}
      >
        {kicker.toUpperCase()}
      </span>
    </div>
  );
}

/** The foot rule: meta on the left, the domain on the right. */
export function Foot({ meta, colour }: { meta: string[]; colour: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid rgba(237,235,243,0.16)',
        paddingTop: 26,
        fontFamily: 'Display',
        fontSize: 22,
        letterSpacing: '0.1em',
        color: MUTED,
      }}
    >
      <span style={{ display: 'flex' }}>{meta.join('  ·  ')}</span>
      <span style={{ display: 'flex', color: colour }}>
        {site.url.replace('https://', '')}
      </span>
    </div>
  );
}

/** The two-colour bar the hero wears, at card scale. */
export function Rule({ pair }: { pair: readonly [string, string] }) {
  return (
    <div style={{ display: 'flex', gap: 14 }}>
      <div style={{ width: 132, height: 5, background: pair[0] }} />
      <div style={{ width: 132, height: 5, background: pair[1] }} />
    </div>
  );
}

/** A wash of the section's colour in the corner, so the card is not a flat
 *  rectangle at thumbnail size. Radial gradients survive satori; blurs do not. */
export function Wash({ pair }: { pair: readonly [string, string] }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        backgroundImage: `radial-gradient(760px 520px at 88% -12%, ${pair[1]}2E, transparent 70%), radial-gradient(620px 440px at -8% 112%, ${pair[0]}24, transparent 70%)`,
      }}
    />
  );
}
