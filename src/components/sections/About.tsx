"use client";

import Image from "next/image";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { sectionThemes, site, timeline } from "@/lib/content";
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
            className="text-pretty text-lg leading-snug text-fg sm:text-2xl"
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
            className="text-pretty text-lg leading-snug sm:text-2xl md:text-[1.75rem]"
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
      data-palette="about"
      className="motif-field relative isolate scroll-mt-24 overflow-x-clip py-24 sm:py-36"
    >
      <div className="container-x">
        <SectionHeader
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

        {/* The person, before the prose about him — this is where a visitor
            goes looking for a face. It bleeds off the left edge of the
            viewport like a photographer's print run to the paper edge: the
            negative lg margin is the gutter plus whatever the container is
            inset by at wide widths, so it lands on x=0 at any size. */}
        <div className="mb-16 grid gap-6 sm:grid-cols-12">
          <Reveal className="sm:col-span-6 lg:col-span-6">
            <figure className="group relative -mx-5 sm:-mx-8 lg:mx-0 lg:-ml-[max(3rem,calc((100vw-88rem)/2+3rem))]">
              <div className="relative aspect-[4/5] overflow-hidden bg-surface/40">
                <Image
                  src="/photo/portrait.webp"
                  alt={`${site.name}, photographed in ${site.location}`}
                  fill
                  sizes="(min-width:1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-[1.2s] ease-expo group-hover:scale-[1.04]"
                  priority={false}
                />
              </div>
              {/* Caption on the print's baseline, the way a contact sheet
                  carries its frame note. */}
              <figcaption className="mt-3 px-5 font-mono text-[11px] leading-relaxed tracking-[0.04em] text-faint sm:px-8 lg:px-0 lg:pl-[max(3rem,calc((100vw-88rem)/2+3rem))]">
                {/* TODO — Mishal: your caption, your call. Swap this line. */}
                The blazer came along and never once got put on.
              </figcaption>
            </figure>
          </Reveal>
        </div>

        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <HighlightBlock paragraphs={paragraphs} />

            {/* Where he actually is right now, read straight off the same
                data the Path section renders — nothing here is a second,
                hand-maintained copy that can drift out of date. The old
                sticky aside duplicated Skills and the socials three times
                over; this says the four things the prose does not. */}
            <dl className="mt-14 grid gap-x-10 gap-y-5 border-t border-fg/[0.1] pt-8 font-mono text-[12px] sm:grid-cols-2">
              {[
                ['Reading for', `${timeline[0].title} · RSET`],
                ['Also in', timeline[0].tags[1]],
                ['Status', site.availability],
                ['Based in', site.location],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1">
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-faint">
                    {k}
                  </dt>
                  <dd className="text-pretty leading-snug text-fg">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
