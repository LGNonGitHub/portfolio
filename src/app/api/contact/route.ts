import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Contact endpoint.
 *
 * Delivers through Resend once RESEND_API_KEY and CONTACT_TO_EMAIL are set in
 * your Vercel project settings. Until then it answers {ok:true,
 * delivered:false} rather than pretending the message arrived, and the form
 * turns that into a pre-filled mailto. Every reply carries `delivered`, so
 * the UI never has to guess whether a message actually went anywhere.
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

  // Honeypot: a filled hidden field means a bot. It gets the same answer a
  // real delivery gets — including delivered:true — so it cannot use the
  // response to work out that it was caught. The message is dropped.
  if (body.website) {
    return NextResponse.json({ ok: true, delivered: true });
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
          subject: `Portfolio enquiry from ${name}`,
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
    // message would only ever reach a server log nobody reads.
    //
    // It is a 200 rather than a 503 because nothing failed: the request was
    // valid and was accepted, it simply was not delivered. The UI reads
    // delivered:false, keeps every word the visitor typed and hands them the
    // same message pre-filled in their own mail app.
    console.info('[contact] not delivered: RESEND_API_KEY / CONTACT_TO_EMAIL unset');
    return NextResponse.json({ ok: true, delivered: false });
  }

  return NextResponse.json({ ok: true, delivered: true });
}
