import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Contact endpoint.
 *
 * Delivers through Resend once RESEND_API_KEY and CONTACT_TO_EMAIL are set in
 * your Vercel project settings. Until then it answers 503 with a mailto
 * fallback rather than pretending the message arrived — the block below picks
 * them up automatically. Without them the form still succeeds so the UI is
 * never broken in a fresh deploy.
 */

type Payload = {
  name?: string;
  email?: string;
  company?: string;
  message?: string;
  website?: string; // honeypot
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Very small in-memory rate limit. Edge instances are ephemeral and not shared,
 * so this only blunts naive floods — for anything serious put a real limiter
 * (Upstash, Vercel KV) in front of it.
 */
const hits = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string) {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  let body: Payload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Honeypot: a filled hidden field means a bot. Return success so it
  // does not learn anything, but drop the message.
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many messages. Please try again in a minute.' },
      { status: 429 },
    );
  }

  const name = body.name?.trim() ?? '';
  const email = body.email?.trim() ?? '';
  const message = body.message?.trim() ?? '';
  const company = body.company?.trim() ?? '';

  if (name.length < 2) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: 'Please enter a valid email address.' },
      { status: 400 },
    );
  }
  if (message.length < 10) {
    return NextResponse.json(
      { error: 'Please add a little more detail to your message.' },
      { status: 400 },
    );
  }
  if (message.length > 5000) {
    return NextResponse.json({ error: 'That message is too long.' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;

  if (apiKey && to) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Portfolio <onboarding@resend.dev>',
          to: [to],
          reply_to: email,
          subject: `Portfolio enquiry — ${name}`,
          text: [
            `Name: ${name}`,
            `Email: ${email}`,
            company && `Company: ${company}`,
            '',
            message,
          ]
            .filter(Boolean)
            .join('\n'),
        }),
      });

      if (!res.ok) {
        console.error('Resend rejected the message:', await res.text());
        return NextResponse.json(
          { error: 'Could not send right now. Please email me directly.' },
          { status: 502 },
        );
      }
    } catch (err) {
      console.error('Contact delivery failed:', err);
      return NextResponse.json(
        { error: 'Could not send right now. Please email me directly.' },
        { status: 502 },
      );
    }
  } else {
    // No mail provider configured. Saying "thanks" here would be a lie — the
    // message would only ever reach a server log nobody reads. Report it
    // honestly so the form can hand the visitor a pre-filled email instead.
    console.warn('[contact] not delivered: RESEND_API_KEY / CONTACT_TO_EMAIL unset');
    return NextResponse.json(
      {
        error: "The form isn't connected to a mailbox yet — your message wasn't sent.",
        fallback: 'mailto',
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
