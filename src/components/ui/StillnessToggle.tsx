'use client';

import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';

/**
 * 静 — stillness. One press pauses every ambient loop on the site: the
 * sigils stop turning, Lenis lets go of the scroll, the canvases hold their
 * last frame. Remembered across visits.
 *
 * It exists for anyone who wants the page without the weather, whether or
 * not their operating system has a reduced-motion setting, or knows it does.
 */
export function StillnessToggle({ className }: { className?: string }) {
  const { motion, toggleStill } = useTheme();
  const still = motion === 'still';

  return (
    <button
      type="button"
      onClick={toggleStill}
      aria-pressed={still}
      aria-label="Stillness: pause ambient motion"
      title="静 Stillness"
      className={cn(
        'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-300',
        still
          ? 'border-accent/60 bg-accent/10 text-accent'
          : 'border-fg/10 text-muted hover:border-accent/50 hover:text-accent',
        className,
      )}
    >
      <span aria-hidden className="jp text-[15px] leading-none">
        静
      </span>
    </button>
  );
}
