import { ImageResponse } from 'next/og';
import { site } from '@/lib/content';
import { Foot, Rule, Wash, fonts, GROUND, INK, MUTED, PAIRS, SIZE } from './og/card';

export const runtime = 'nodejs';
export const alt = `${site.name} — ${site.role}`;
export const size = SIZE;
export const contentType = 'image/png';

/**
 * The card a link to the site itself unfurls into: the hero, reduced to what
 * survives a WhatsApp thumbnail — the name, the 剣/杖 pair, one line of prose.
 */
export default async function OpengraphImage() {
  const pair = PAIRS.prologue;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          background: GROUND,
          padding: '66px 72px',
          fontFamily: 'Display',
        }}
      >
        <Wash pair={pair} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 21,
            letterSpacing: '0.22em',
            color: MUTED,
          }}
        >
          <span style={{ display: 'flex' }}>{site.role.toUpperCase()}</span>
          <span style={{ display: 'flex', gap: 18, fontFamily: 'Mincho', fontSize: 40, letterSpacing: 0 }}>
            <span style={{ color: pair[0] }}>剣</span>
            <span style={{ color: pair[1] }}>杖</span>
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <Rule pair={pair} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 128,
              lineHeight: 1.02,
              color: INK,
              letterSpacing: '-0.035em',
            }}
          >
            <span style={{ display: 'flex' }}>{site.nameLines[0]}</span>
            <span style={{ display: 'flex' }}>
              {site.nameLines[1]}
              <span style={{ color: pair[0] }}>.</span>
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Serif',
              fontStyle: 'italic',
              fontSize: 40,
              color: MUTED,
              maxWidth: 820,
            }}
          >
            {site.tagline}
          </div>
        </div>

        <Foot meta={[site.location]} colour={pair[1]} />
      </div>
    ),
    { ...size, fonts: await fonts() },
  );
}
