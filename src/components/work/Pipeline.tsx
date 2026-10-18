import { pipeline } from '@/lib/work';
import { cn } from '@/lib/utils';

/**
 * PictoTrack's two routes, drawn as what they are: ordered lists. A diagram
 * made of divs reads as decoration to a screen reader; an <ol> per lane says
 * "these steps happen in this order", which is the whole point of the picture.
 * The arrows are aria-hidden because the list order already carries them.
 *
 * Every step string comes from src/lib/work.ts, which transcribes them from
 * the project description — nothing here is invented for the diagram's sake.
 */
export function Pipeline({
  project = 'pictotrack',
  className,
}: {
  project?: string;
  className?: string;
}) {
  const lanes = pipeline[project];
  if (!lanes) return null;

  return (
    <div
      className={cn(
        'hud-frame border border-accent/25 bg-surface/40 p-5 sm:p-7',
        className,
      )}
    >
      {lanes.map((lane, li) => (
        <section key={lane.lane} className={li > 0 ? 'mt-7' : undefined}>
          <h4 className="eyebrow mb-3">
            {li < 2 ? `Route ${li + 1} · ` : ''}
            {lane.lane}
          </h4>
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
            {lane.steps.map((step, si) => (
              <li key={step} className="flex items-center gap-2">
                <span className="border border-fg/20 bg-bg/40 px-2.5 py-1.5 font-mono text-[11px] text-fg/90">
                  {step}
                </span>
                {si < lane.steps.length - 1 && (
                  <span aria-hidden className="font-mono text-xs text-accent/70">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
