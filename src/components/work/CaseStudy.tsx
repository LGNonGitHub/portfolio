import Image from 'next/image';
import { ArrowUpRight, Github } from 'lucide-react';
import { projects, type Project } from '@/lib/content';
import { shots, capturedAt } from '@/lib/work';
import { Pipeline } from '@/components/work/Pipeline';
import { ProjectArtwork } from '@/components/ui/ProjectArtwork';

/**
 * The case-study body, shared by the modal and the /work/[id] page so the two
 * can never drift. It renders no dialog chrome of its own — whoever mounts it
 * owns the frame.
 *
 * The hero is evidence where evidence exists: the dated capture for
 * CarbonZero, the lane diagram for PictoTrack. ProjectArtwork survives only
 * as the fallback for a project that has neither yet.
 */
export function CaseStudy({
  project,
  titleAs = 'h3',
}: {
  project: Project;
  /** h1 on its own page, h3 inside the modal where the section owns the h2. */
  titleAs?: 'h1' | 'h3';
}) {
  const Title = titleAs;
  const sheet = shots[project.id];
  const hero = sheet?.[0];

  return (
    <>
      <div className="relative w-full overflow-hidden">
        {hero ? (
          <figure>
            <Image
              src={hero.src}
              width={hero.w}
              height={hero.h}
              alt={hero.alt}
              sizes="(max-width: 1024px) 100vw, 900px"
              className="w-full border border-accent/30"
              priority={titleAs === 'h1'}
            />
            <figcaption className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              {hero.caption} · captured {capturedAt}
            </figcaption>
          </figure>
        ) : project.id === 'pictotrack' ? (
          <Pipeline project="pictotrack" />
        ) : (
          <div className="aspect-[16/9] w-full">
            <ProjectArtwork
              variant={projects.findIndex((p) => p.id === project.id)}
              palette={project.palette}
              className="h-full w-full"
            />
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <Title className="display text-4xl text-fg sm:text-5xl">
            {project.title}
          </Title>
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-accent">
            {project.year} · {project.role}
          </span>
        </div>
        <p className="mt-2 font-serif text-xl italic text-muted">
          {project.subtitle}
        </p>

        <p className="mt-8 max-w-2xl text-pretty text-base leading-relaxed text-fg/90">
          {project.description}
        </p>

        <div className="mt-10 grid gap-10 sm:grid-cols-2">
          <div>
            <h4 className="eyebrow mb-4">Incantation</h4>
            <ul className="space-y-3">
              {project.highlights.map((h) => (
                <li
                  key={h}
                  className="flex gap-3 text-sm leading-relaxed text-muted"
                >
                  <span
                    aria-hidden
                    className="mt-[0.5em] h-1 w-1 shrink-0 rounded-full bg-accent"
                  />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="eyebrow mb-4">Catalysts</h4>
            <ul className="flex flex-wrap gap-2">
              {project.stack.map((s) => (
                <li
                  key={s}
                  className="rounded-full border border-fg/[0.14] px-3 py-1.5 font-mono text-[11px] text-muted"
                >
                  {s}
                </li>
              ))}
            </ul>

            {(project.links.live || project.links.repo) && (
              <div className="mt-8 flex flex-wrap gap-3">
                {project.links.live && (
                  <a
                    href={project.links.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-ink"
                  >
                    Live site
                    <ArrowUpRight
                      size={15}
                      aria-hidden
                      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                    />
                  </a>
                )}
                {project.links.repo && (
                  <a
                    href={project.links.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-fg/15 px-5 py-2.5 text-sm text-fg transition-colors hover:border-accent hover:text-accent"
                  >
                    <Github size={15} aria-hidden />
                    Source
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
