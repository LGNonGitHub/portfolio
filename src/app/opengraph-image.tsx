import { ImageResponse } from 'next/og';
import { site } from '@/lib/content';

export const runtime = 'edge';
export const alt = `${site.name} — ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#08060e',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 22,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#847A98',
          }}
        >
          <span>{site.role}</span>
          <span>{site.location}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 120, height: 4, background: '#3CD68C' }} />
            <div style={{ width: 120, height: 4, background: '#A276FF' }} />
          </div>
          <div
            style={{
              fontSize: 132,
              lineHeight: 0.9,
              fontWeight: 700,
              color: '#EDEBF3',
              letterSpacing: '-0.04em',
              display: 'flex',
            }}
          >
            Mohammed
          </div>
          <div
            style={{
              fontSize: 132,
              lineHeight: 0.9,
              fontWeight: 700,
              color: '#EDEBF3',
              letterSpacing: '-0.04em',
              display: 'flex',
            }}
          >
            Mishal<span style={{ color: '#3CD68C' }}>.</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '1px solid rgba(237,235,243,0.14)',
            paddingTop: 28,
            fontSize: 26,
            color: '#9E98B0',
          }}
        >
          <span style={{ maxWidth: 680 }}>{site.tagline}</span>
          <span style={{ color: '#A276FF' }}>
            {site.url.replace('https://', '')}
          </span>
        </div>
      </div>
    ),
    size,
  );
}
