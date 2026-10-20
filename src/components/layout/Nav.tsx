"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { nav, site, socials } from "@/lib/content";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useRuntime } from "@/hooks/useRuntime";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Magnetic } from "@/components/ui/Magnetic";
import { StillnessToggle } from "@/components/ui/StillnessToggle";
import { scrollY, subscribe } from "@/lib/frame";
import { centreOf } from "@/lib/transition";
import { DUR, EASE_CAST, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Nav() {
  const [condensed, setCondensed] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, accent, toggle, toggleAccent } = useTheme();
  const section = useRuntime((s) => s.section);
  const desktop = useMediaQuery("(min-width: 1024px)");

  // Section anchors only exist on the home page. Anywhere else (a case study,
  // the 404) the same links have to go home first.
  const home = usePathname() === "/";
  const to = (hash: string) => (home ? hash : `/${hash}`);

  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const releaseRef = useRef<(() => void) | null>(null);

  // Read from the shared ticker instead of a scroll listener of our own, and
  // only touch React when the boolean actually flips.
  useEffect(() => {
    let last: boolean | null = null;
    return subscribe(() => {
      const next = scrollY() > 80;
      if (next === last) return;
      last = next;
      setCondensed(next);
    });
  }, []);

  // The menu is a modal dialog: the page behind it is inert (unreachable by
  // Tab and by screen readers, not just covered), focus starts on the first
  // link, and it comes back to the burger when the menu closes.
  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const burger = burgerRef.current;

    const behind = Array.from(
      document.querySelectorAll<HTMLElement>("#main, footer"),
    ).filter((el) => el.id === "main" || !el.closest("#main"));
    behind.forEach((el) => el.setAttribute("inert", ""));
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new Event("lenis:stop"));

    let released = false;
    releaseRef.current = () => {
      if (released) return;
      released = true;
      behind.forEach((el) => el.removeAttribute("inert"));
      document.body.style.overflow = overflow;
      window.dispatchEvent(new Event("lenis:start"));
    };

    menu?.querySelector<HTMLElement>("a[href]")?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      releaseRef.current?.();
      releaseRef.current = null;
      // Back to the burger — unless a link has already handed focus to the
      // section it points at, which is where a keyboard user wants to be.
      const active = document.activeElement;
      if (!active || active === document.body || menu?.contains(active)) {
        burger?.focus({ preventScroll: true });
      }
    };
  }, [open]);

  // Widening past the breakpoint hides the overlay with CSS; without this the
  // page behind would stay inert with no visible way out.
  useEffect(() => {
    if (desktop) setOpen(false);
  }, [desktop]);

  /** A menu link: release the page synchronously, before SmoothScroll's
   *  handler runs, so the eased scroll is not cancelled by Lenis restarting
   *  and focus can land on a section that is no longer inert. */
  const followLink = () => {
    releaseRef.current?.();
    releaseRef.current = null;
    setOpen(false);
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10001] focus:rounded-full focus:bg-accent focus:px-5 focus:py-2.5 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-accent-ink"
      >
        Skip to content
      </a>

      <header
        id="site-header"
        className={cn(
          // lg:top-7 clears the telemetry strip, which only shows at lg.
          "fixed inset-x-0 top-0 z-[9990] transition-all duration-500 ease-expo lg:top-7",
          condensed ? "py-3" : "py-5 sm:py-7",
        )}
      >
        <div className="container-x">
          <div
            className={cn(
              "flex items-center justify-between rounded-full transition-all duration-500 ease-expo",
              condensed
                ? "glass border border-fg/[0.08] px-4 py-2.5 shadow-[0_8px_40px_-12px_rgb(0_0_0_/_0.25)] sm:px-6"
                : "border border-transparent px-0 py-0",
            )}
          >
            {/* Wordmark */}
            <a
              href={to("#top")}
              className="group flex items-center gap-2.5"
              aria-label={`${site.name}, back to top`}
            >
              <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-accent/40 bg-accent/10">
                <Image
                  src="/photo/avatar.webp"
                  alt=""
                  fill
                  sizes="36px"
                  className="object-cover"
                  priority
                />
                {/* The dashed ring still turns on hover; it now orbits the
                    photograph instead of the monogram it replaced. */}
                <span
                  aria-hidden
                  className="absolute inset-[3px] rounded-full border border-dashed border-accent-2/60 transition-transform duration-[2.4s] ease-linear group-hover:rotate-180"
                />
              </span>
              <span className="wordmark hidden text-[17px] sm:block">
                Mohammed Mishal
              </span>
            </a>

            {/* Desktop links. No magnetic pull here: dragging a 13px target
                around under the pointer made it harder to hit, not easier. */}
            <nav
              className="hidden items-center gap-1 lg:flex"
              aria-label="Primary"
            >
              {nav.map((item) => {
                const active = item.href === `#${section}`;
                return (
                  <a
                    key={item.href}
                    href={to(item.href)}
                    aria-current={active ? "location" : undefined}
                    className={cn(
                      "group relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-colors hover:text-fg",
                      active ? "text-fg" : "text-muted",
                    )}
                  >
                    {/* One pill, shared across links by layoutId, so it
                        slides to the section you scroll into. */}
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-accent/10 ring-1 ring-accent/30"
                        transition={{ duration: DUR.move, ease: EASE_OUT }}
                      />
                    )}
                    {/* Muted, not faint: at 10px over a section's wash (the
                        glass bar tints with it) faint fell to 4.4:1. On the
                        active pill in light theme the accent sits on its own
                        10% tint and drops just under 4.5:1, so there it is
                        ink; the pill and its ring carry the colour. */}
                    <span
                      className={cn(
                        "relative font-mono text-[10px] transition-colors group-hover:text-accent",
                        active ? "text-fg dark:text-accent" : "text-muted",
                      )}
                    >
                      {item.index}
                    </span>
                    {/* Label crossfades to its kanji on hover. The English stays
                        in the accessibility tree; the kanji is decorative. The
                        data attributes let the intro land its glyphs here. */}
                    <span className="relative grid">
                      <span
                        data-nav-label=""
                        className="col-start-1 row-start-1 transition-opacity duration-300 group-hover:opacity-0"
                      >
                        {item.label}
                      </span>
                      <span
                        data-nav-jp=""
                        aria-hidden
                        className="col-start-1 row-start-1 text-center text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      >
                        {item.jp}
                      </span>
                    </span>
                  </a>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Duality switch — swaps which discipline leads the palette.
                  Pressed means the wand (code) leads. */}
              <button
                type="button"
                onClick={(e) => toggleAccent(centreOf(e.currentTarget))}
                aria-pressed={accent === "purple"}
                aria-label="Wand / Code leads the palette"
                title={accent === "green" ? "剣 Sword · Design leads" : "杖 Wand · Code leads"}
                className="group relative flex h-9 items-center gap-2 rounded-full border border-fg/10 px-3 transition-colors hover:border-accent/50"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inset-0 rounded-full bg-accent transition-colors duration-500" />
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-accent" />
                </span>
                <span
                  aria-hidden
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors group-hover:text-fg"
                >
                  {accent === "green" ? "剣" : "杖"}
                </span>
              </button>

              <StillnessToggle className="hidden sm:flex" />

              <button
                type="button"
                onClick={(e) => toggle(centreOf(e.currentTarget))}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-fg/10 text-muted transition-colors hover:border-accent/50 hover:text-accent"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={theme}
                    initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                    className="flex"
                  >
                    {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                  </motion.span>
                </AnimatePresence>
              </button>

              <Magnetic strength={0.25} className="hidden sm:block">
                <a
                  href={to("#contact")}
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
                ref={burgerRef}
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                aria-controls="mobile-menu"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-fg/10 lg:hidden"
              >
                <span className="relative block h-3 w-4">
                  <span
                    className={cn(
                      "absolute left-0 h-[1.5px] w-full bg-fg transition-all duration-300 ease-expo",
                      open ? "top-1/2 rotate-45" : "top-0",
                    )}
                  />
                  <span
                    className={cn(
                      "absolute left-0 h-[1.5px] w-full bg-fg transition-all duration-300 ease-expo",
                      open ? "top-1/2 -rotate-45" : "bottom-0",
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
            ref={menuRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-[9989] flex flex-col justify-between overflow-y-auto bg-bg px-5 pb-10 pt-28 lg:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease: EASE_CAST }}
          >
            <nav aria-label="Mobile">
              <ul>
                {nav.map((item, i) => {
                  const active = item.href === `#${section}`;
                  return (
                    <li
                      key={item.href}
                      className="overflow-hidden border-b border-fg/[0.08]"
                    >
                      <motion.a
                        href={to(item.href)}
                        onClick={followLink}
                        aria-current={active ? "location" : undefined}
                        className="flex items-baseline gap-4 py-5"
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{
                          duration: 0.7,
                          delay: 0.15 + i * 0.06,
                          ease: EASE_OUT,
                        }}
                      >
                        <span className="font-mono text-xs text-accent">
                          {item.index}
                        </span>
                        {/* The episode you are in, in its colour: large
                            text, so the accent clears 3:1 in both themes. */}
                        <span
                          className={cn(
                            "display text-4xl",
                            active ? "text-accent" : "text-fg",
                          )}
                        >
                          {item.label}
                        </span>
                        {/* The same glyph the intro ignites on the hexagram for
                            this section — the menu is the circle, unrolled. */}
                        <span
                          aria-hidden
                          className="ml-auto font-serif text-2xl text-accent-2/70"
                        >
                          {item.jp}
                        </span>
                      </motion.a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 space-y-6"
            >
              {/* Phones have no room for 静 in the bar, so it lives here,
                  with its meaning spelled out. */}
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-fg/[0.08] px-4 py-3">
                <span className="flex items-center gap-3">
                  <span aria-hidden className="jp text-2xl leading-none text-accent">
                    静
                  </span>
                  <span>
                    <span className="block text-sm text-fg">Stillness</span>
                    <span className="block font-mono text-[10px] uppercase tracking-widest text-muted">
                      Pause ambient motion
                    </span>
                  </span>
                </span>
                <StillnessToggle />
              </div>

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
              <a
                href={`mailto:${site.email}`}
                className="block font-display text-xl text-fg"
              >
                {site.email}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
