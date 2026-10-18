'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { projects, sectionThemes, type Project } from '@/lib/content';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Spread } from '@/components/work/Spread';
import { ProjectModal } from '@/components/work/ProjectModal';
import { cn } from '@/lib/utils';

/**
 * Filters come from the projects that exist, not a fixed list. A hardcoded
 * set meant three of five buttons led to an empty grid and the fourth just
 * repeated "All". With a single category the row is hidden outright; it
 * comes back on its own the day a second kind of project is added.
 */
const present = Array.from(new Set(projects.map((p) => p.category)));
const categories = ['All', ...present] as const;
const showFilter = present.length > 1;

/**
 * Two projects do not make a grid — a bento of placeholder artwork was the
 * site admitting it had nothing to show. Each project now gets a full
 * grimoire spread: the name at headline size, the facts beside it, and real
 * evidence on the facing page (a dated capture of the live deployment, or a
 * pipeline you can run on your own photo).
 */
export function Projects() {
  const [filter, setFilter] = useState<string>('All');
  const [active, setActive] = useState<Project | null>(null);

  const visible =
    filter === 'All' ? projects : projects.filter((p) => p.category === filter);

  return (
    <section
      id="work"
      data-palette="work"
      className="relative isolate scroll-mt-24 overflow-x-clip py-24 sm:py-36"
    >
      <div className="container-x">
        <SectionHeader
          art={{ src: '/art/work.webp', fallback: 'grimoire' }}
          index="01"
          label="Grimoire"
          jp="作品"
          emblem={sectionThemes.work.emblem}
          title={['Things I have', 'built so far']}
        />

        {showFilter && (
          <div className="mb-10 flex flex-wrap items-center gap-3">
            <div
              className="flex flex-wrap gap-1.5 rounded-full border border-fg/[0.08] bg-bg/75 p-1 backdrop-blur-sm"
              role="tablist"
              aria-label="Filter projects by category"
            >
              {categories.map((c) => {
                const selected = filter === c;
                return (
                  <button
                    key={c}
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setFilter(c)}
                    className={cn(
                      'relative rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-300',
                      selected ? 'text-accent-ink' : 'text-muted hover:text-fg',
                    )}
                  >
                    {selected && (
                      <motion.span
                        layoutId="filter-pill"
                        className="absolute inset-0 rounded-full bg-accent"
                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{c}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {visible.map((project, i) => (
          <Spread
            key={project.id}
            project={project}
            index={i}
            onOpen={() => setActive(project)}
          />
        ))}

        {visible.length === 0 && (
          <p className="py-20 text-center text-sm text-muted">
            Nothing in this category yet.
          </p>
        )}
      </div>

      <ProjectModal project={active} onClose={() => setActive(null)} />
    </section>
  );
}
