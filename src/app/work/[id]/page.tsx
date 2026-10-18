import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { projects, site } from '@/lib/content';
import { shots, capturedAt } from '@/lib/work';
import { CaseStudy } from '@/components/work/CaseStudy';
import { Pipeline } from '@/components/work/Pipeline';

/**
 * The destination behind the modal's pushState. The modal already writes
 * /work/<id> into the address bar so a case study can be shared or reloaded;
 * without this route that URL would 404 on the very share it invites, which
 * is worse than having no deep link at all.
 *
 * Static params with dynamicParams = false so an invented id 404s at the
 * edge rather than rendering an empty shell.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  if (!project) return {};
  return {
    title: `${project.title} — ${project.subtitle}`,
    description: project.summary,
    alternates: { canonical: `${site.url}/work/${project.id}` },
    openGraph: {
      title: `${project.title} — ${project.subtitle}`,
      description: project.summary,
      url: `${site.url}/work/${project.id}`,
    },
  };
}

export default async function WorkCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  if (!project) notFound();

  const sheet = shots[project.id];

  return (
    <main id="main" data-palette="work" className="container-x py-32">
      <Link
        href="/#work"
        className="mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent focus-visible:text-accent"
      >
        &larr; Back to the grimoire
      </Link>

      <article className="mt-10">
        <CaseStudy project={project} titleAs="h1" />
      </article>

      {/*
        The evidence under the write-up: the remaining captures for CarbonZero
        (CaseStudy already shows the first), the lane diagram for PictoTrack.
        Nothing is substituted when a project has neither.
      */}
      {sheet && sheet.length > 1 ? (
        <section className="mt-20 grid gap-10">
          {sheet.slice(1).map((shot) => (
            <figure key={shot.src}>
              <Image
                src={shot.src}
                width={shot.w}
                height={shot.h}
                alt={shot.alt}
                sizes="(max-width: 1024px) 100vw, 1100px"
                className="w-full border border-accent/30"
              />
              <figcaption className="mono mt-3 text-xs text-muted">
                {shot.caption} · captured {capturedAt}
              </figcaption>
            </figure>
          ))}
        </section>
      ) : null}

      {project.id === 'pictotrack' ? (
        <section className="mt-20">
          <h2 className="display-cond text-3xl text-fg">The pipeline</h2>
          <Pipeline className="mt-8" />
        </section>
      ) : null}
    </main>
  );
}
