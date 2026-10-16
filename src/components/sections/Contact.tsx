'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Check, Loader2 } from 'lucide-react';
import { sectionThemes, site, socials } from '@/lib/content';
import { TextReveal } from '@/components/ui/TextReveal';
import { Magnetic } from '@/components/ui/Magnetic';
import { SectionEmblem } from '@/components/ui/SectionEmblem';
import { SectionVisual } from '@/components/ui/SectionVisual';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function Contact() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    setStatus('sending');
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Something went wrong.');

      setStatus('sent');
      form.reset();
      setTimeout(() => setStatus('idle'), 6000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <section id="contact" className="motif-field relative isolate scroll-mt-24 overflow-hidden py-24 sm:py-36">
      {/* Section artwork; falls back to drawn art if the image is removed */}
        <SectionVisual src="/art/contact.webp" fallback="bloom" />
        <div className="container-x">
        {/* Oversized CTA */}
        <div className="mb-20 border-b border-fg/[0.1] pb-16">
          <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="h-7 w-7 shrink-0 text-accent">
              <SectionEmblem kind={sectionThemes.contact.emblem} />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
              06 — Summons
            </span>
            <span aria-hidden className="h-px w-8 bg-accent/60" />
            <span aria-hidden className="font-serif text-base text-accent-2">
              連絡
            </span>
          </div>
          <TextReveal
            as="h2"
            text={['Got something', 'worth building?']}
            className="display text-accent"
            lineClassName="h-display"
          />

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Magnetic strength={0.3}>
              <a
                href={`mailto:${site.email}`}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-accent to-accent2 px-7 py-4 text-base font-medium text-accent-ink"
              >
                <span className="absolute inset-0 translate-y-full bg-fg transition-transform duration-500 ease-expo group-hover:translate-y-0" />
                <span className="relative z-10 transition-colors duration-500 group-hover:text-bg">
                  {site.email}
                </span>
                <ArrowUpRight
                  size={18}
                  className="relative z-10 transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-bg"
                />
              </a>
            </Magnetic>

            <p className="max-w-xs text-pretty text-sm leading-relaxed text-muted">
              Open to internships, freelance and collaborations from{' '}
              <span className="text-fg">{site.availableFrom}</span>. I reply to
              everything within a couple of days.
            </p>
          </div>
        </div>

        <div className="grid gap-16 lg:grid-cols-12">
          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-7 lg:col-span-7" noValidate>
            <div className="grid gap-7 sm:grid-cols-2">
              <Field label="Your name" name="name" required autoComplete="name" />
              <Field
                label="Email"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </div>
            <Field label="Company / project" name="company" autoComplete="organization" />
            <Field label="What do you have in mind?" name="message" textarea required />

            {/* Honeypot — real people leave this empty; bots fill it in. */}
            <div className="absolute left-[-9999px]" aria-hidden>
              <label htmlFor="website">Website</label>
              <input id="website" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-2">
              <Magnetic strength={0.22}>
                <button
                  type="submit"
                  disabled={status === 'sending' || status === 'sent'}
                  className={cn(
                    'group relative inline-flex min-w-[180px] items-center justify-center gap-2.5 overflow-hidden rounded-full px-7 py-3.5 text-sm font-medium transition-colors duration-300',
                    status === 'sent'
                      ? 'bg-accent text-accent-ink'
                      : 'bg-fg text-bg hover:bg-accent hover:text-accent-ink',
                    status === 'sending' && 'cursor-wait opacity-80',
                  )}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={status}
                      className="flex items-center gap-2.5"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22 }}
                    >
                      {status === 'sending' && (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          Sending
                        </>
                      )}
                      {status === 'sent' && (
                        <>
                          <Check size={15} />
                          Message sent
                        </>
                      )}
                      {(status === 'idle' || status === 'error') && (
                        <>
                          Send message
                          <ArrowUpRight size={15} />
                        </>
                      )}
                    </motion.span>
                  </AnimatePresence>
                </button>
              </Magnetic>

              <AnimatePresence>
                {status === 'error' && (
                  <motion.p
                    role="alert"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-red-400"
                  >
                    {error}
                  </motion.p>
                )}
                {status === 'sent' && (
                  <motion.p
                    role="status"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-muted"
                  >
                    Thanks — I&rsquo;ll be in touch shortly.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </form>

          {/* Sidebar */}
          <aside className="space-y-10 lg:col-span-4 lg:col-start-9">
            <div>
              <h3 className="eyebrow mb-4">Guild halls</h3>
              <ul className="divide-y divide-fg/[0.1] border-y border-fg/[0.1]">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between py-3.5"
                    >
                      <span className="text-sm text-fg transition-colors group-hover:text-accent">
                        {s.label}
                      </span>
                      <ArrowUpRight
                        size={15}
                        className="text-faint transition-all duration-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="eyebrow mb-3">Based in</h3>
              <p className="text-sm text-fg">{site.location}</p>
              <p className="mt-1 font-mono text-[11px] text-faint">
                {site.timezone.replace('_', ' ')}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
  textarea,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  const shared = {
    id: name,
    name,
    required,
    autoComplete,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    className:
      'w-full border-0 border-b border-fg/[0.14] bg-transparent py-3 text-base text-fg outline-none transition-colors placeholder:text-faint focus:border-transparent',
  };

  return (
    <div className="relative">
      <label
        htmlFor={name}
        className="mb-1 block font-mono text-[11px] uppercase tracking-[0.16em] text-faint"
      >
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </label>

      {textarea ? (
        <textarea {...shared} rows={5} className={`${shared.className} resize-none`} />
      ) : (
        <input {...shared} type={type} />
      )}

      {/* Animated focus underline */}
      <span
        aria-hidden
        className={cn(
          'absolute bottom-0 left-0 h-[1.5px] w-full origin-left bg-accent transition-transform duration-500 ease-expo',
          focused ? 'scale-x-100' : 'scale-x-0',
        )}
      />
    </div>
  );
}
