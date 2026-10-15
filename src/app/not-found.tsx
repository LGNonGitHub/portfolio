import Link from 'next/link';
import { site } from '@/lib/content';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center px-5 text-center">
      <span className="eyebrow">Error 404</span>
      <h1 className="display mt-6 text-[22vw] leading-none text-fg sm:text-[14rem]">
        404
      </h1>
      <p className="mt-6 max-w-sm text-pretty text-sm leading-relaxed text-muted">
        This page does not exist — or it did once and I moved it without leaving
        a forwarding address.
      </p>
      <Link
        href="/"
        className="group mt-10 inline-flex items-center gap-2 rounded-full bg-fg px-6 py-3 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-accent-ink"
      >
        Back to {site.name.split(' ')[1]}&rsquo;s work
      </Link>
    </main>
  );
}
