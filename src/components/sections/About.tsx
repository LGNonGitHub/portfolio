"use client";

import Image from "next/image";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { sectionThemes, site, socials } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { useReducedMotion } from "@/hooks/useMediaQuery";

/** TODO — Mishal: these are drafted from what you told me. Rewrite in your own
    words wherever they sound like someone else. */
const paragraphs = [
  "I am a second-year Information Technology student at Rajagiri School of Engineering and Technology, originally from Palakkad. I write code in Java and Python, and I have been pointed at software development for a while now.",
  "The other half is a camera. Film Club in school turned into the Media and Film Club at RSET, and photography and videography stopped being a hobby somewhere along the way. I like that both halves are the same problem — deciding what to leave out.",
  "Right now I am building things, entering hackathons, and looking for internships where I can be useful rather than decorative. Long term: software developer and designer, with freelance photography and videography running alongside it.",
];

/**
 * Scroll-driven word highlight.
 *
 * All three paragraphs share ONE scroll progress value spanning the whole
 * block, and each gets a disjoint slice of it. That is what makes them strictly
 * sequential: paragraph two's first word cannot brighten until paragraph one's
 * last word has. Giving each paragraph its own useScroll (the obvious approach)
 * lets them overlap whenever two are on screen at once.
 */
function HighlightBlock({ paragraphs }: { paragraphs: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.55"],
  });

  if (reduced) {
    return (
      <div className="space-y-10">
        {paragraphs.map((text, i) => (
          <p
            key={i}
            className="text-pretty text-xl leading-snug text-fg sm:text-2xl"
          >
            {text}
          </p>
        ))}
      </div>
    );
  }

  // Weight each paragraph's slice by its length so a long one does not race.
  const totalWords = paragraphs.reduce((n, t) => n + t.split(" ").length, 0);
  let consumed = 0;
  const slices = paragraphs.map((text) => {
    const words = text.split(" ").length;
    const from = consumed / totalWords;
    consumed += words;
    return [from, consumed / totalWords] as const;
  });

  return (
    <div ref={ref} className="space-y-10">
      {paragraphs.map((text, pi) => {
        const [from, to] = slices[pi];
        const words = text.split(" ");
        return (
          <p
            key={pi}
            className="text-pretty text-xl leading-snug sm:text-2xl md:text-[1.75rem]"
          >
            {words.map((word, wi) => {
              const span = (to - from) / words.length;
              const start = from + wi * span;
              return (
                <Word
                  key={`${pi}-${wi}`}
                  progress={scrollYProgress}
                  range={[start, start + span]}
                >
                  {word}
                </Word>
              );
            })}
          </p>
        );
      })}
    </div>
  );
}

function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <span className="relative mr-[0.26em] inline-block">
      <span className="absolute inset-0 text-fg/20" aria-hidden>
        {children}
      </span>
      <motion.span style={{ opacity }} className="text-fg">
        {children}
      </motion.span>
    </span>
  );
}

export function About() {
  return (
    <section
      id="about"
      className="motif-field relative isolate scroll-mt-24 overflow-hidden py-24 sm:py-36"
    >
      <div className="container-x">
        <SectionHeader
          art={{ src: "/art/about.webp", fallback: "bolt" }}
          index="02"
          label="Origin"
          jp="紹介"
          emblem={sectionThemes.about.emblem}
          title={["The short", "version"]}
        >
          <p className="eyebrow">
            Design-engineer
            <br />
            {site.location}
          </p>
        </SectionHeader>

        {/* The person, before the prose about him. Both frames are the same
            afternoon — the portrait leads, the full length sits beside it. */}
        <div className="mb-16 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-12">
          <Reveal className="col-span-1 lg:col-span-4">
            <figure className="group relative overflow-hidden rounded-xl border border-fg/[0.08] bg-surface/40">
              <div className="relative aspect-[4/5]">
                <Image
                  src="/photo/portrait.webp"
                  alt={`${site.name}, photographed in ${site.location}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover transition-transform duration-[1.2s] ease-expo group-hover:scale-[1.04]"
                  priority={false}
                />
              </div>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-accent/0 transition-all duration-700 group-hover:ring-accent/40"
              />
            </figure>
          </Reveal>

          <Reveal className="col-span-1 lg:col-span-3" delay={0.08}>
            <figure className="group relative overflow-hidden rounded-xl border border-fg/[0.08] bg-surface/40">
              <div className="relative aspect-[4/7]">
                <Image
                  src="/photo/full.webp"
                  alt={`${site.name}, full length`}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover object-top transition-transform duration-[1.2s] ease-expo group-hover:scale-[1.04]"
                  priority={false}
                />
              </div>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-accent/0 transition-all duration-700 group-hover:ring-accent/40"
              />
            </figure>
          </Reveal>

          <Reveal
            className="col-span-2 flex items-end lg:col-span-4 lg:col-start-8"
            delay={0.16}
          >
            <div>
              <p className="eyebrow mb-3">In person</p>
              <p className="text-pretty text-sm leading-relaxed text-muted">
                {/* TODO — Mishal: your caption, your call. Swap this line. */}
                The blazer came along for both photographs and never once got
                put on.
              </p>
              <p className="mt-4 font-mono text-[11px] tracking-[0.04em] text-faint">
                {site.location}
              </p>
            </div>
          </Reveal>
        </div>

        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <HighlightBlock paragraphs={paragraphs} />
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <Reveal className="sticky top-32 space-y-10 rounded-xl bg-bg/70 p-5 backdrop-blur-sm">
              <div>
                <h3 className="eyebrow mb-4">Abilities</h3>
                <ul className="space-y-2.5">
                  {[
                    "Software development — Java & Python",
                    "Web apps with React & TypeScript",
                    "Interface design",
                    "Photography",
                    "Videography & editing",
                    "Team management",
                  ].map((item) => (
                    <li
                      key={item}
                      className="group flex items-center gap-3 text-sm text-muted transition-colors hover:text-fg"
                    >
                      <span className="h-px w-4 bg-fg/25 transition-all duration-500 ease-expo group-hover:w-8 group-hover:bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="eyebrow mb-4">Elsewhere</h3>
                <ul className="space-y-2.5">
                  {socials.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-baseline justify-between gap-4 text-sm"
                      >
                        <span className="link-underline text-fg">
                          {s.label}
                        </span>
                        <span className="font-mono text-[11px] text-faint transition-colors group-hover:text-accent">
                          {s.handle}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </aside>
        </div>
      </div>
    </section>
  );
}
