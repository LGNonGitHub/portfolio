'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Share2, X } from 'lucide-react';
import { useMounted } from '@/hooks/useMounted';
import { site, type Project } from '@/lib/content';
import { CaseStudy } from '@/components/work/CaseStudy';

/**
 * The case-study dialog.
 *
 * Two things here are deliberate and were both bugs before:
 *
 * 1. It is portalled to <body>. Rendered in place it sat inside #work, whose
 *    `isolate` makes a stacking context — so its z-index only ranked within
 *    that section and the fixed nav covered the close button. Measured: a
 *    click at the button's centre hit the nav header.
 * 2. It owns a URL. An open case study is a page you can send someone, so it
 *    pushes /work/<id> and closing pops it back. window.history is used
 *    directly rather than router.push: the App Router would unmount this
 *    section to render the route, and the modal is meant to stay in place
 *    over the grimoire.
 */
export function ProjectModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const mounted = useMounted();
  const [copied, setCopied] = useState(false);
  // Set when the close is already being driven by a history event, so we do
  // not push or pop a second time.
  const fromHistory = useRef(false);

  const requestClose = useCallback(() => {
    if (typeof window === 'undefined') {
      onClose();
      return;
    }
    if (window.history.state?.modal) {
      // popstate will land and call onClose for us.
      window.history.back();
      return;
    }
    // Opened without an entry of our own (e.g. a restored session) — rewrite
    // the URL in place rather than sending the visitor off the page.
    window.history.replaceState(null, '', '/#work');
    onClose();
  }, [onClose]);

  // URL ownership + popstate.
  useEffect(() => {
    if (!project) return;
    window.history.pushState({ modal: project.id }, '', `/work/${project.id}`);

    const onPop = () => {
      fromHistory.current = true;
      onClose();
    };
    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('popstate', onPop);
      // Closed by something other than history (unmount, filter change): put
      // the URL back where it was without touching the entry stack.
      if (!fromHistory.current && window.history.state?.modal) {
        window.history.replaceState(null, '', '/#work');
      }
      fromHistory.current = false;
    };
  }, [project, onClose]);

  // Escape to close, and keep Tab inside the dialog while it is open.
  useEffect(() => {
    if (!project) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.dispatchEvent(new Event('lenis:stop'));
    setCopied(false);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        requestClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

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

    window.addEventListener('keydown', onKey);
    const id = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('button, a[href]')?.focus();
    }, 80);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(id);
      document.body.style.overflow = prevOverflow;
      window.dispatchEvent(new Event('lenis:start'));
      // The trigger can unmount while the dialog is open (e.g. the category
      // filter changed underneath it), so only restore focus if it survived.
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus?.();
      }
    };
  }, [project, requestClose]);

  const share = useCallback(async () => {
    if (!project) return;
    const url = `${site.url.replace(/\/$/, '')}/work/${project.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: project.title, text: project.summary, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_500);
    } catch {
      // A cancelled share sheet is not an error worth shouting about.
    }
  }, [project]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {project && (
        <motion.div
          data-lenis-prevent
          className="fixed inset-0 z-[10002] flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label={`${project.title} case study`}
          onClick={requestClose}
        >
          <div aria-hidden className="fixed inset-0 bg-bg/80 backdrop-blur-md" />

          <motion.article
            ref={panelRef}
            className="hud-frame relative my-4 w-full max-w-4xl border border-accent/25 bg-surface p-6 shadow-[0_40px_120px_-20px_rgb(0_0_0_/_0.6)] sm:p-10"
            initial={{ opacity: 0, y: 48, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Controls first in the DOM so the focus trap opens on Close. */}
            <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={share}
                aria-label={`Share the ${project.title} case study`}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-fg/20 bg-bg/80 text-fg backdrop-blur-md transition-colors hover:border-accent hover:text-accent"
              >
                <Share2 size={16} aria-hidden />
              </button>
              <button
                type="button"
                onClick={requestClose}
                aria-label="Close case study"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 bg-bg/80 text-fg backdrop-blur-md transition-colors hover:bg-accent hover:text-accent-ink"
              >
                <X size={16} aria-hidden />
              </button>
            </div>

            {copied && (
              <p
                role="status"
                className="absolute right-4 top-[4.25rem] z-10 rounded-full border border-accent/40 bg-bg/90 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent"
              >
                Link copied
              </p>
            )}

            <div className="pt-10 sm:pt-6">
              <CaseStudy project={project} />
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
