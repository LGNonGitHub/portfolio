'use client';

import { useEffect } from 'react';

/**
 * Route-level boundary. Without it any client exception — a lazy chunk that
 * fails to download is the realistic one — replaced the whole page with
 * Next's bare "Application error" screen.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center px-5 text-center">
      <span className="eyebrow">The spell misfired</span>
      <h1 className="display mt-6 text-5xl leading-none text-fg sm:text-7xl">
        Something broke
        <span className="block font-serif font-normal italic text-accent">mid-cast.</span>
      </h1>
      <p className="mt-6 max-w-sm text-pretty text-sm leading-relaxed text-muted">
        A piece of the page failed to load. Trying again usually fixes it — a
        slow connection is the usual culprit.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-fg px-6 py-3 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-ink"
      >
        Try again
      </button>
    </main>
  );
}
