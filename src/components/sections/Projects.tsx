"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMounted } from "@/hooks/useMounted";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Github, X } from "lucide-react";
import { projects, sectionThemes, type Project } from "@/lib/content";
import { ProjectArtwork } from "@/components/ui/ProjectArtwork";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { MagicCircle } from "@/components/ui/MagicCircle";
import { Tilt } from "@/components/ui/Tilt";
import { Magnetic } from "@/components/ui/Magnetic";
import { cn } from "@/lib/utils";

/**
 * Filters come from the projects that exist, not a fixed list. A hardcoded
 * set meant three of five buttons led to an empty grid and the fourth just
 * repeated "All". With a single category the row is hidden outright; it
 * comes back on its own the day a second kind of project is added.
 */
const present = Array.from(new Set(projects.map((p) => p.category)));
const categories = ["All", ...present] as const;
const showFilter = present.length > 1;

/**
 * Column spans over a 6-column grid, cycling by position. The pattern sums to
 * 6 on every row (4+2, 2+4, 3+3), so the grid tiles flush no matter which
 * filter is active.
 */
const TILES = [
  { span: "md:col-span-4", aspect: "aspect-[21/9]" },
  { span: "md:col-span-2", aspect: "aspect-[4/3]" },
  { span: "md:col-span-2", aspect: "aspect-[4/3]" },
  { span: "md:col-span-4", aspect: "aspect-[21/9]" },
  { span: "md:col-span-3", aspect: "aspect-[16/9]" },
  { span: "md:col-span-3", aspect: "aspect-[16/9]" },
] as const;

export function Projects() {
  const [filter, setFilter] = useState<string>("All");
  const [active, setActive] = useState<Project | null>(null);

  const visible =
    filter === "All" ? projects : projects.filter((p) => p.category === filter);

  return (
    <section
      id="work"
      className="relative isolate scroll-mt-24 overflow-hidden py-24 sm:py-36"
    >
      <div className="container-x">
        <SectionHeader
          art={{ src: "/art/work.webp", fallback: "grimoire" }}
          index="01"
          label="Grimoire"
          jp="作品"
          emblem={sectionThemes.work.emblem}
          title={["Things I have", "built so far"]}
        />

        {showFilter && (
          <>
            {/* Filter sits below the header, which owns the artwork band */}
            <div className="mb-10 flex flex-wrap items-center gap-3">
              {/* Filter */}
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
                        "relative rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-300",
                        selected
                          ? "text-accent-ink"
                          : "text-muted hover:text-fg",
                      )}
                    >
                      {selected && (
                        <motion.span
                          layoutId="filter-pill"
                          className="absolute inset-0 rounded-full bg-accent"
                          transition={{
                            type: "spring",
                            stiffness: 320,
                            damping: 30,
                          }}
                        />
                      )}
                      <span className="relative z-10">{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Grid — featured projects span wider */}
        <motion.div layout className="grid gap-5 md:grid-cols-6">
          <AnimatePresence mode="popLayout">
            {visible.map((project, i) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.96, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                  layout: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                }}
                className={TILES[i % TILES.length].span}
              >
                <ProjectCard
                  project={project}
                  index={i}
                  aspect={TILES[i % TILES.length].aspect}
                  onOpen={() => setActive(project)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

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

function ProjectCard({
  project,
  index,
  aspect,
  onOpen,
}: {
  project: Project;
  index: number;
  aspect: string;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <Tilt className="h-full" max={5}>
      <button
        ref={ref}
        onClick={onOpen}
        aria-label={`Open case study: ${project.title}`}
        className="motif-card hud-frame group relative flex h-full w-full flex-col overflow-hidden border border-fg/[0.1] bg-surface/40 text-left transition-colors duration-500 hover:border-accent/40"
      >
        {/* Artwork */}
        <div className={cn("relative w-full overflow-hidden", aspect)}>
          <motion.div
            className="absolute inset-0"
            whileHover={{ scale: 1.045 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <ProjectArtwork
              variant={index}
              palette={project.palette}
              className="h-full w-full"
            />
          </motion.div>

          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />

          {/* Spell sigil surfaces on hover */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          >
            <MagicCircle
              className="h-[85%] w-auto max-w-[85%]"
              points={5 + (index % 4)}
              seed={index + 2}
              glyphs={false}
            />
          </div>

          <span className="absolute left-4 top-4 border border-accent/40 bg-bg/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent backdrop-blur-sm">
            {project.category}
          </span>
          <span className="absolute right-4 top-4 font-mono text-[10px] text-fg/80">
            {project.year}
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="display h-card text-fg">{project.title}</h3>
              <p className="mt-1 text-sm text-muted">{project.subtitle}</p>
            </div>
            <span className="mt-1 shrink-0 text-fg/40 transition-all duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent">
              <ArrowUpRight size={20} />
            </span>
          </div>

          <p className="mt-4 text-pretty text-sm leading-relaxed text-muted">
            {project.summary}
          </p>

          <ul className="mt-5 flex flex-wrap gap-1.5 pt-1">
            {project.stack.slice(0, 4).map((s) => (
              <li
                key={s}
                className="border border-fg/[0.12] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-faint transition-colors group-hover:border-accent-2/30"
              >
                {s}
              </li>
            ))}
            {project.stack.length > 4 && (
              <li className="px-1.5 py-1 font-mono text-[10px] text-faint">
                +{project.stack.length - 4}
              </li>
            )}
          </ul>

          {/* Bottom accent sweep */}
          <span
            aria-hidden
            className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-gradient-to-r from-accent to-accent2 transition-transform duration-700 ease-expo group-hover:scale-x-100"
          />
        </div>
      </button>
    </Tilt>
  );
}

function ProjectModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);

  // Escape to close, and keep Tab inside the dialog while it is open.
  useEffect(() => {
    if (!project) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new Event("lenis:stop"));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    // Move focus into the dialog on open.
    const id = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("button, a[href]")?.focus();
    }, 80);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(id);
      document.body.style.overflow = prevOverflow;
      window.dispatchEvent(new Event("lenis:start"));
      // The trigger can unmount while the dialog is open (e.g. the category
      // filter changed underneath it), so only restore focus if it survived.
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus?.();
      }
    };
  }, [project, onClose]);

  // Portalled to <body>. Rendered in place it sat inside #work, whose
  // `isolate` makes a stacking context — so its z-[9995] only ranked within
  // that section and the fixed nav (z-[9990], root context) covered the close
  // button. Measured: a click at the button's centre hit the nav header.
  const mounted = useMounted();
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {project && (
        <motion.div
          data-lenis-prevent
          className="fixed inset-0 z-[9995] flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label={`${project.title} case study`}
          onClick={onClose}
        >
          <div
            aria-hidden
            className="fixed inset-0 bg-bg/80 backdrop-blur-md"
          />

          <motion.article
            ref={panelRef}
            className="hud-frame relative my-4 w-full max-w-4xl overflow-hidden border border-accent/25 bg-surface shadow-[0_40px_120px_-20px_rgb(0_0_0_/_0.6)]"
            initial={{ opacity: 0, y: 48, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <ProjectArtwork
                variant={projects.findIndex((p) => p.id === project.id)}
                palette={project.palette}
                className="h-full w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />

              <Magnetic strength={0.3} className="absolute right-4 top-4">
                <button
                  onClick={onClose}
                  aria-label="Close case study"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 bg-bg/70 text-fg backdrop-blur-md transition-colors hover:bg-accent hover:text-accent-ink"
                >
                  <X size={16} />
                </button>
              </Magnetic>
            </div>

            <div className="p-6 sm:p-10">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <h3 className="display text-4xl text-fg sm:text-5xl">
                  {project.title}
                </h3>
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
                        <span className="mt-[0.5em] h-1 w-1 shrink-0 rounded-full bg-accent" />
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
                          className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
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
                        <Github size={15} />
                        Source
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
