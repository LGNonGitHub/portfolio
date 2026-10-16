'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { credits, site, socials, nav } from '@/lib/content';
import { Magnetic } from '@/components/ui/Magnetic';
import { Marquee } from '@/components/ui/Marquee';
import { formatTime } from '@/lib/utils';

export function Footer() {
  const [clock, setClock] = useState('');
  const year = new Date().getFullYear();

  useEffect(() => {
    const update = () => setClock(formatTime(new Date(), site.timezone));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="relative overflow-hidden border-t border-fg/[0.1] pt-16">
      <div className="container-x">
        <div className="grid gap-12 pb-16 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="font-serif text-2xl italic leading-tight text-fg">
              Let&rsquo;s make something
              <br />
              worth looking at.
            </p>
            <p aria-hidden className="mt-4 flex items-center gap-3 font-serif text-xl">
              <span className="text-green">剣</span>
              <span className="h-4 w-px bg-fg/20" />
              <span className="text-purple">杖</span>
            </p>
            <a
              href={`mailto:${site.email}`}
              className="link-underline mt-6 inline-block text-sm text-muted hover:text-accent"
            >
              {site.email}
            </a>
          </div>

          <nav className="md:col-span-3" aria-label="Footer">
            <h3 className="eyebrow mb-4">Navigate</h3>
            <ul className="space-y-2.5">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="link-underline text-sm text-muted hover:text-fg"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-3">
            <h3 className="eyebrow mb-4">Guild halls</h3>
            <ul className="space-y-2.5">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline text-sm text-muted hover:text-fg"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex md:col-span-1 md:justify-end">
            <Magnetic strength={0.35}>
              <a
                href="#top"
                aria-label="Back to top"
                className="group flex h-14 w-14 items-center justify-center rounded-full border border-fg/15 transition-colors duration-500 hover:border-accent hover:bg-accent"
              >
                <ArrowUp
                  size={18}
                  className="text-fg transition-all duration-500 group-hover:-translate-y-0.5 group-hover:text-accent-ink"
                />
              </a>
            </Magnetic>
          </div>
        </div>

        {/* Credits — attribution for everything here that is someone else's */}
        <section
          aria-labelledby="credits-heading"
          className="border-t border-fg/[0.1] py-12"
        >
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h3 id="credits-heading" className="eyebrow mb-4">
                Credits &amp; attribution
              </h3>
              <p className="max-w-sm text-pretty text-[13px] leading-relaxed text-muted">
                {credits.intro}
              </p>
            </div>

            <div className="lg:col-span-5">
              <h4 className="eyebrow mb-4">Series</h4>
              <ul className="divide-y divide-fg/[0.08] border-y border-fg/[0.08]">
                {credits.series.map((s) => (
                  <li
                    key={s.title}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block text-[13px] text-fg">{s.title}</span>
                      <span className="mt-0.5 block text-[11px] text-faint">
                        <span aria-hidden className="jp">{s.jp}</span>
                        <span className="mx-1.5" aria-hidden>·</span>
                        {s.creator} · {s.studio}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                      {s.section}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-3">
              <h4 className="eyebrow mb-4">Assets</h4>
              <ul className="space-y-4">
                {credits.assets.map((a) => (
                  <li key={a.what}>
                    <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                      {a.what}
                    </span>
                    <span className="mt-1 block text-pretty text-[12px] leading-relaxed text-muted">
                      {'href' in a && a.href ? (
                        <a
                          href={a.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-underline text-muted hover:text-accent"
                        >
                          {a.detail}
                        </a>
                      ) : (
                        a.detail
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Meta bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-fg/[0.1] py-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
            © {year} {site.name}
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
            {site.location} · <span className="tabular-nums">{clock || '--:--:--'}</span>
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
            Built with Next.js · Deployed on Vercel
          </p>
        </div>
      </div>

      {/* Oversized outlined wordmark */}
      <div aria-hidden className="relative -mb-[2vw] select-none pt-6">
        <Marquee speed={60} className="opacity-100">
          <span className="wordmark whitespace-nowrap px-8 text-[18vw] text-outline">
            Mohammed Mishal ✦
          </span>
        </Marquee>
      </div>
    </footer>
  );
}
