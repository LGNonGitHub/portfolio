import { ImageResponse } from 'next/og';
import { projects } from '@/lib/content';
import { episodeFor } from '@/lib/episodes';
import { Foot, Slate, Wash, fonts, GROUND, INK, MUTED, PAIRS, SIZE } from '@/app/og/card';

export const runtime = 'edge';
export const size = SIZE;
export const contentType = 'image/png';

/** One card per case study, pre-rendered with the page. */
export function generateImageMetadata({ params }: { params: { id: string } }) {
  const project = projects.find((p) => p.id === params.id);
  return [
    {
      id: params.id,
      size,
      contentType,
      alt: project ? `${project.title} — ${project.subtitle}` : 'Case study',
    },
  ];
}

export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }));
}

/**
 * The grimoire spread at thumbnail size: the work palette, the episode slate
 * the section opens on, and the one line that says what the project is. The
 * slate numeral follows the project's place in the running order, so sharing
 * two case studies reads as two episodes of the same season.
 */
export default async function WorkOpengraphImage({
  params,
}: {
  params: { id: string };
}) {
  const index = projects.findIndex((p) => p.id === params.id);
  const project = projects[index];
  const pair = PAIRS.work;
  const episode = episodeFor(String(index + 1));

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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Slate
            slate={episode?.slate ?? '第壱話'}
            kicker={episode?.kicker ?? 'Episode 01'}
            colour={pair[0]}
          />
          <span
            style={{
              display: 'flex',
              fontSize: 20,
              letterSpacing: '0.24em',
              color: MUTED,
            }}
          >
            CASE STUDY
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 118,
              lineHeight: 1.04,
              color: INK,
              letterSpacing: '-0.035em',
            }}
          >
            {project.title}
            <span style={{ color: pair[0] }}>.</span>
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Serif',
              fontStyle: 'italic',
              fontSize: 42,
              color: MUTED,
              maxWidth: 900,
            }}
          >
            {project.subtitle}
          </div>
        </div>

        <Foot meta={[project.year, project.role, project.category]} colour={pair[1]} />
      </div>
    ),
    { ...size, fonts: await fonts() },
  );
}
