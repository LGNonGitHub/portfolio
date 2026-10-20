"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, Copy, Loader2 } from "lucide-react";
import { site, socials } from "@/lib/content";
import { EPISODES } from "@/lib/episodes";
import { TextReveal } from "@/components/ui/TextReveal";
import { KanjiWrite } from "@/components/ui/KanjiWrite";
import { Magnetic } from "@/components/ui/Magnetic";
import { Boundary } from "@/components/ui/Boundary";
import { SummonsSeal } from "@/components/ui/SummonsSeal";
import { MagicCircle } from "@/components/ui/MagicCircle";
import { cn } from "@/lib/utils";

/** idle → sending → one of: sent, not-delivered, error. */
type Status = "idle" | "sending" | "sent" | "not-delivered" | "error";
type Errors = Partial<Record<"name" | "email" | "message", string>>;

/** The same test the route runs, so the client never promises the server
 *  something it will reject — and never rejects what it would accept. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(d: Record<string, string>): Errors {
  const e: Errors = {};
  if ((d.name ?? "").trim().length < 2) e.name = "Please enter your name.";
  if (!EMAIL_RE.test((d.email ?? "").trim()))
    e.email = "Please enter a valid email address.";
  const msg = (d.message ?? "").trim();
  if (msg.length < 10) e.message = "Please add a little more detail.";
  else if (msg.length > 5000) e.message = "That message is too long.";
  return e;
}

/**
 * 次回予告 — the next-episode preview.
 *
 * The season ends the way an episode ends: not on a section heading but on a
 * preview card for whatever comes next, which here is the thing the visitor
 * might build with him. That is why this opener is hand-built rather than a
 * SectionHeader — the slate reads 次回予告 instead of an episode number, and
 * it closes on つづく.
 *
 * Everything under it is honest about what it can actually do. If no mailbox
 * is wired to this deploy the form says so in those words, keeps every word
 * typed, and hands over the same message pre-filled in the visitor's own mail
 * app. A delivered message gets a seal struck from its own timestamp.
 */
export function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  /** Set when delivery is unavailable: the visitor's own words, ready to send. */
  const [mailto, setMailto] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState<Date | null>(null);
  const [sender, setSender] = useState("");
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<
      string,
      string
    >;

    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length) {
      // Focus the first field that failed. Without this the error text is
      // announced somewhere below a screen reader's cursor and nowhere near
      // the caret, and on a phone it is off-screen entirely.
      const first = (["name", "email", "message"] as const).find(
        (k) => found[k],
      );
      if (first) form.querySelector<HTMLElement>(`#${first}`)?.focus();
      return;
    }

    setStatus("sending");
    setError("");
    setMailto(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Something went wrong.");

      if (json.delivered === false) {
        // Nothing they typed is lost: it becomes a draft in their own mail app.
        const body = [
          data.message,
          "",
          `${data.name}${data.company ? ` · ${data.company}` : ""}`,
          data.email,
        ].join("\n");
        setMailto(
          `mailto:${site.email}?subject=${encodeURIComponent(
            `Portfolio enquiry from ${data.name}`,
          )}&body=${encodeURIComponent(body)}`,
        );
        setStatus("not-delivered");
        return; // the form keeps its values — they are the draft
      }

      setSender(data.name);
      setSentAt(new Date());
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Clipboard denied (insecure context, or the visitor said no). The
      // address is written out in full beside this button, so nothing is lost.
    }
  }

  return (
    <section
      id="contact"
      data-palette="contact"
      className="motif-field relative isolate scroll-mt-24 overflow-x-clip py-24 sm:py-36"
    >
      <div className="container-x">
        <header className="relative isolate mb-14 grid grid-cols-12 gap-x-6 lg:grid-rows-[auto_auto_auto_auto_auto] border-b border-fg/[0.1] pb-12 sm:mb-20 sm:pb-16">
          {/* Slate row — 次回予告 rather than an episode number, because this
              is the preview, not another episode. */}
          <div className="relative z-10 col-span-full flex flex-col items-start gap-3 lg:col-[1/7] lg:row-start-1 lg:flex-row lg:items-center lg:gap-5">
            <span
              aria-hidden
              className="jp text-[clamp(1.6rem,2.4vw,2.25rem)] leading-none text-accent-2"
            >
              {EPISODES["06"].slate}
            </span>
            <span aria-hidden className="hidden h-px w-12 bg-accent lg:block" />
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
              NEXT EPISODE · SUMMONS · ( N&deg; 006 )
            </p>
          </div>

          {/* 連絡, written in stroke order. One instance, re-placed by class:
              a column at lg, the right gutter below it. */}
          <div
            aria-hidden
            data-stage-avoid="soft"
            className="pointer-events-none absolute right-0 top-0 z-0 w-[30vw] opacity-[0.38] lg:relative lg:col-[11/13] lg:row-[1/4] lg:w-auto lg:self-start lg:opacity-100"
          >
            <KanjiWrite text="連絡" size="gutter" className="w-full" />
          </div>

          <div
            data-stage-avoid
            className="relative z-10 col-span-full mt-8 lg:col-[1/9] lg:row-start-3 lg:mt-14"
          >
            <TextReveal
              as="h2"
              text={["Got something", "worth building?"]}
              className="display-cond h-mega max-lg:!text-[clamp(3.2rem,16vw,6.5rem)]"
              lineClassNames={{
                0: "text-fg",
                1: "font-serif font-normal italic tracking-[-0.01em] text-accent",
              }}
            />
          </div>

          {/* Plate slot — where the GL stage lands the contact bloom. */}
          <div
            data-stage-slot
            className="relative col-span-full mt-10 lg:col-[6/11] lg:row-[2/3] lg:mt-0 lg:min-h-[min(38svh,20rem)] lg:self-start"
          >
            {/* No plate: the artwork is credited once, in the Hobby ED.
                The slot stays so the GL bloom still has somewhere to land. */}
            <MagicCircle
              aria-hidden
              className="stage-fallback h-full w-full opacity-40"
              points={6}
              seed={4}
              glyphs={false}
            />
          </div>

          {/* CTA row: the address itself, a 44px copy target beside it, and
              the availability sentence that the seal later repeats. */}
          <div className="col-span-full mt-10 flex flex-wrap items-center gap-x-5 gap-y-6 lg:col-[1/9] lg:row-start-4">
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

            <button
              type="button"
              onClick={copyEmail}
              className="inline-flex h-11 min-w-[44px] items-center gap-2 rounded-full border border-fg/20 px-4 text-sm text-fg transition-colors hover:border-accent hover:text-accent"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              Copy email
            </button>
            <span role="status" className="text-sm text-accent">
              {copied ? "Copied" : ""}
            </span>

            <p className="max-w-xs text-pretty text-sm leading-relaxed text-muted">
              Open to internships, freelance and collaborations from{" "}
              <span className="text-fg">{site.availableFrom}</span>. I reply to
              everything within a couple of days.
            </p>
          </div>

          {/* The end card. Decorative — the English above says it already. */}
          <p
            aria-hidden
            className="col-span-full mt-10 font-mono text-[11px] uppercase tracking-[0.3em] text-faint lg:row-start-5"
          >
            <span className="jp not-italic tracking-normal text-accent-2">
              つづく
            </span>{" "}
            · to be continued
          </p>
        </header>

        <div className="grid gap-12 sm:gap-16 lg:grid-cols-12">
          <form
            ref={formRef}
            onSubmit={onSubmit}
            className="space-y-5 sm:space-y-7 lg:col-span-7"
            noValidate
          >
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-7">
              <Field
                label="Your name"
                name="name"
                required
                autoComplete="name"
                error={errors.name}
              />
              <Field
                label="Email"
                name="email"
                type="email"
                required
                autoComplete="email"
                error={errors.email}
              />
            </div>
            <Field
              label="Company / project"
              name="company"
              autoComplete="organization"
            />
            <Field
              label="What do you have in mind?"
              name="message"
              textarea
              required
              error={errors.message}
            />

            {/* Honeypot — real people leave this empty; bots fill it in. */}
            <div className="absolute left-[-9999px]" aria-hidden>
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-2">
              <Magnetic strength={0.22}>
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className={cn(
                    "group relative inline-flex min-w-[180px] items-center justify-center gap-2.5 overflow-hidden rounded-full px-7 py-3.5 text-sm font-medium transition-colors duration-300",
                    status === "sent"
                      ? "bg-accent text-accent-ink"
                      : "bg-fg text-bg hover:bg-accent hover:text-accent-ink",
                    status === "sending" && "cursor-wait opacity-80",
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
                      {status === "sending" ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          Sending
                        </>
                      ) : status === "sent" ? (
                        <>
                          <Check size={15} />
                          Message sent
                        </>
                      ) : (
                        <>
                          Send message
                          <ArrowUpRight size={15} />
                        </>
                      )}
                    </motion.span>
                  </AnimatePresence>
                </button>
              </Magnetic>

              {status === "error" && (
                <p
                  role="alert"
                  className="text-sm text-[rgb(var(--danger))]"
                >
                  {error}
                </p>
              )}
            </div>

            {/* Not delivered. Said plainly, with the draft ready to send. */}
            {status === "not-delivered" && mailto && (
              <div
                role="alert"
                className="rounded-lg border border-[rgb(var(--danger))]/40 bg-[rgb(var(--danger))]/[0.07] p-4 text-sm"
              >
                <p className="text-[rgb(var(--danger))]">
                  Not delivered. Mail isn&rsquo;t connected on this deploy yet.
                  Send it from your mail app instead:
                </p>
                <a
                  href={mailto}
                  className="link-underline mt-2 inline-block font-medium text-accent"
                >
                  Open {site.email}
                </a>
              </div>
            )}

            {/* Delivered. The seal is spectacle, so it is boundaried: if it
                throws, the confirmation above it still stands. */}
            {status === "sent" && sentAt && (
              <Boundary fallback={null}>
                <SummonsSeal name={sender} sentAt={sentAt} />
              </Boundary>
            )}
          </form>

          <div className="space-y-10 lg:col-span-4 lg:col-start-9">
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
                {site.timezone.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  textarea,
  autoComplete,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  autoComplete?: string;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const shared = {
    id: name,
    name,
    required,
    autoComplete,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? `${name}-error` : undefined,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    className: cn(
      // A faint fill, because a bare bottom-border with nothing typed in it
      // reads as empty page rather than a field — worst on a phone.
      "w-full rounded-t-md border-0 border-b bg-fg/[0.035] px-3 py-3 text-base text-fg outline-none transition-colors placeholder:text-faint focus:bg-fg/[0.06]",
      error
        ? "border-[rgb(var(--danger))]"
        : "border-fg/[0.14] focus:border-transparent",
    ),
  };

  return (
    <div className="relative">
      <label
        htmlFor={name}
        className="mb-2 block font-mono text-[11px] uppercase tracking-[0.16em] text-faint"
      >
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </label>

      {textarea ? (
        <textarea
          {...shared}
          rows={4}
          className={`${shared.className} resize-none`}
        />
      ) : (
        <input {...shared} type={type} />
      )}

      {/* Animated focus underline */}
      <span
        aria-hidden
        className={cn(
          "absolute bottom-0 left-0 h-[1.5px] w-full origin-left bg-accent transition-transform duration-500 ease-expo",
          focused ? "scale-x-100" : "scale-x-0",
        )}
      />

      {error && (
        <p
          id={`${name}-error`}
          className="mt-1.5 text-[13px] text-[rgb(var(--danger))]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
