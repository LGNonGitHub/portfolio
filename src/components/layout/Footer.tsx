'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { site, socials, nav } from '@/lib/content';
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
            <h3 className="eyebrow mb-4">Elsewhere</h3>
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
          <span className="display whitespace-nowrap px-8 text-[18vw] leading-none text-outline">
            Mohammed Mishal —
          </span>
        </Marquee>
      </div>
    </footer>
  );
}
