'use client';

import { TextReveal } from '@/components/ui/TextReveal';
import { SectionEmblem, type EmblemKind } from '@/components/ui/SectionEmblem';
import { cn } from '@/lib/utils';

/**
 * Shared section header: index, English label, Japanese label, and a
 * green-to-purple rule. Keeping it in one place is what stops the five
 * sections from drifting apart visually.
 */
export function SectionHeader({
  index,
  label,
  jp,
  title,
  series,
  emblem,
  children,
  className,
}: {
  /** Section number. Pass an empty string for unnumbered sections. */
  index: string;
  label: string;
  jp: string;
  title: string | string[];
  /** The series this section is themed after, named so it is identifiable. */
  series?: string;
  emblem?: EmblemKind;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('mb-14', className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            {emblem && (
              <span className="h-7 w-7 shrink-0 text-accent">
                <SectionEmblem kind={emblem} />
              </span>
            )}
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
              {index ? `${index} — ${label}` : label}
            </span>
            <span aria-hidden className="h-px w-8 bg-accent/60" />
            <span aria-hidden className="font-serif text-base text-accent-2">
              {jp}
            </span>
            {series && (
              <span className="rounded-full border border-accent/35 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                {series}
              </span>
            )}
          </div>
          <TextReveal as="h2" text={title} className="display h-section text-accent" />
        </div>

        {children}
      </div>

      <div aria-hidden className="duality-rule mt-6 h-px w-full" />
    </header>
  );
}
