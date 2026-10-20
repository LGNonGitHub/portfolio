'use client';

import { usePathname } from 'next/navigation';

/**
 * Echoes back the path that failed. A 404 that does not say what it could not
 * find makes you wonder whether you mistyped it — this removes the doubt, and
 * it is the only client JS on the page.
 */
export function NotFoundPath() {
  const pathname = usePathname();

  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
      PATH {pathname} · NO CIRCLE FOUND
    </p>
  );
}
