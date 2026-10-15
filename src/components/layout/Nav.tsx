'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { nav, site, socials } from '@/lib/content';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Magnetic } from '@/components/ui/Magnetic';
import { formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function Nav() {
  const { scrollY } = useScroll();
  const [condensed, setCondensed] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, accent, toggle, toggleAccent } = useTheme();
  const [clock, setClock] = useState('');

  useMotionValueEvent(scrollY, 'change', (v) => setCondensed(v > 80));

  useEffect(() => {
    const update = () => setClock(formatTime(new Date(), site.timezone));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Lock the page behind the mobile menu, and let Escape close it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10001] focus:rounded-full focus:bg-accent focus:px-5 focus:py-2.5 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-accent-ink"
      >
        Skip to content
      </a>

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-[9990] transition-all duration-500 ease-expo',
          condensed ? 'py-3' : 'py-5 sm:py-7',
        )}
      >
        <div className="container-x">
          <div
            className={cn(
              'flex items-center justify-between rounded-full transition-all duration-500 ease-expo',
              condensed
                ? 'glass border border-fg/[0.08] px-4 py-2.5 shadow-[0_8px_40px_-12px_rgb(0_0_0_/_0.25)] sm:px-6'
                : 'border border-transparent px-0 py-0',
            )}
          >
            {/* Wordmark */}
            <a
              href="#top"
              className="group flex items-center gap-2.5"
              aria-label={`${site.name} — back to top`}
            >
              <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-accent/40 bg-accent/10">
                <span
                  aria-hidden
                  className="absolute inset-[3px] rounded-full border border-dashed border-accent-2/50 transition-transform duration-[2.4s] ease-linear group-hover:rotate-180"
                />
                <span className="relative font-display text-sm font-bold text-accent">
                  M
                </span>
              </span>
              <span className="hidden font-display text-[15px] font-semibold tracking-tight sm:block">
                Mohammed Mishal
              </span>
            </a>

            {/* Desktop links */}
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
              {nav.map((item) => (
                <Magnetic key={item.href} strength={0.2}>
                  <a
                    href={item.href}
                    className="group relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm text-muted transition-colors hover:text-fg"
                  >
                    <span className="font-mono text-[10px] text-faint transition-colors group-hover:text-accent">
                      {item.index}
                    </span>
                    {/* Label crossfades to its kanji on hover. The English stays
                        in the accessibility tree; the kanji is decorative. */}
                    <span className="relative grid">
                      <span className="col-start-1 row-start-1 transition-opacity duration-300 group-hover:opacity-0">
                        {item.label}
                      </span>
                      <span
                        aria-hidden
                        className="col-start-1 row-start-1 text-center text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      >
                        {item.jp}
                      </span>
                    </span>
                  </a>
                </Magnetic>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden font-mono text-[11px] tabular-nums text-faint xl:block">
                {clock || '--:--:--'} IST
              </span>

              {/* Duality switch — swaps which discipline leads the palette. */}
              <button
                onClick={toggleAccent}
                aria-label={`Accent: ${accent === 'green' ? 'Sword / Design' : 'Wand / Code'}. Switch to ${accent === 'green' ? 'Wand / Code' : 'Sword / Design'}.`}
                title={accent === 'green' ? 'Sword · Design' : 'Wand · Code'}
                className="group relative flex h-9 items-center gap-2 rounded-full border border-fg/10 px-3 transition-colors hover:border-accent/50"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inset-0 rounded-full bg-accent transition-colors duration-500" />
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-accent" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors group-hover:text-fg">
                  {accent === 'green' ? '剣' : '杖'}
                </span>
              </button>

              <button
                onClick={toggle}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-fg/10 text-muted transition-colors hover:border-accent/50 hover:text-accent"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={theme}
                    initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="flex"
                  >
                    {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                  </motion.span>
                </AnimatePresence>
              </button>

              <Magnetic strength={0.25} className="hidden sm:block">
                <a
                  href="#contact"
                  className="group relative inline-flex items-center overflow-hidden rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg"
                >
                  <span className="absolute inset-0 translate-y-full bg-accent transition-transform duration-500 ease-expo group-hover:translate-y-0" />
                  <span className="relative z-10 transition-colors duration-500 group-hover:text-accent-ink">
                    Let&rsquo;s talk
                  </span>
                </a>
              </Magnetic>

              {/* Burger */}
              <button
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-fg/10 lg:hidden"
              >
                <span className="relative block h-3 w-4">
                  <span
                    className={cn(
                      'absolute left-0 h-[1.5px] w-full bg-fg transition-all duration-300 ease-expo',
                      open ? 'top-1/2 rotate-45' : 'top-0',
                    )}
                  />
                  <span
                    className={cn(
                      'absolute left-0 h-[1.5px] w-full bg-fg transition-all duration-300 ease-expo',
                      open ? 'top-1/2 -rotate-45' : 'bottom-0',
                    )}
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[9989] flex flex-col justify-between bg-bg px-5 pb-10 pt-28 lg:hidden"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav aria-label="Mobile">
              <ul>
                {nav.map((item, i) => (
                  <li key={item.href} className="overflow-hidden border-b border-fg/[0.08]">
                    <motion.a
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline gap-4 py-5"
                      initial={{ y: '100%', opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        duration: 0.7,
                        delay: 0.15 + i * 0.06,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <span className="font-mono text-xs text-accent">{item.index}</span>
                      <span className="display text-4xl">{item.label}</span>
                    </motion.a>
                  </li>
                ))}
              </ul>
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline font-mono text-xs uppercase tracking-widest text-muted"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
              <a href={`mailto:${site.email}`} className="block font-display text-xl text-fg">
                {site.email}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
