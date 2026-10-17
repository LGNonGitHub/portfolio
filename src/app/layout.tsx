import type { Metadata, Viewport } from 'next';
import {
  Bricolage_Grotesque,
  Inter,
  Instrument_Serif,
  JetBrains_Mono,
} from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import '@/styles/palettes.css';
import { site } from '@/lib/content';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SmoothScroll } from '@/components/providers/SmoothScroll';
import { Preloader } from '@/components/layout/Preloader';
import { ScrollProgress } from '@/components/layout/ScrollProgress';
import { Nav } from '@/components/layout/Nav';
import { Telemetry } from '@/components/layout/Telemetry';
import { Footer } from '@/components/layout/Footer';
import { KonamiEgg } from '@/components/layout/KonamiEgg';
import { Petals } from '@/components/ui/Petals';
import { SectionTheme } from '@/components/providers/SectionTheme';
import { ThemeColor } from '@/components/providers/ThemeColor';
import { FocusReticle } from '@/components/ui/FocusReticle';

/**
 * Japan Ramen — used for ONE thing: the name. Latin only, so it never has to
 * render the Japanese labels.
 *
 * NOTE: personal-use build. The licence forbids promotional and commercial use
 * outright — see src/app/fonts/JapanRamen-LICENSE.txt.
 */
const name = localFont({
  src: './fonts/JapanRamen.woff2',
  variable: '--font-name',
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
});

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.role}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  keywords: [
    'Mohammed Mishal',
    'designer',
    'developer',
    'front-end engineer',
    'portfolio',
    'design engineer',
    'UI design',
    'React',
    'Next.js',
  ],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.role}`,
    description: site.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — ${site.role}`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  // No themeColor here: ThemeColor.tsx owns the one <meta name="theme-color">
  // (server-rendered in <head> below) and tints it per section.
  width: 'device-width',
  initialScale: 1,
};

/**
 * Applied before first paint so the right theme is already on <html> and there
 * is no flash of the wrong palette.
 *
 * Dark is the default. The intro is cast on black and hands the page the
 * sigil it ends on, so dropping into a light palette would break the handover
 * mid-shot — and the accent colours carry further against it. A stored choice
 * still wins; a system preference alone does not.
 */
const themeScript = `
(function(){
  var el = document.documentElement;
  try {
    var t = localStorage.getItem('theme');
    el.dataset.theme = t === 'light' || t === 'dark' ? t : 'dark';
    var a = localStorage.getItem('accent');
    el.dataset.accent = a === 'purple' || a === 'green' ? a : 'green';
    if (localStorage.getItem('motion') === 'still') el.dataset.motion = 'still';
  } catch (e) {
    el.dataset.theme = 'dark';
    el.dataset.accent = 'green';
  }
})();
`;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.name,
  url: site.url,
  jobTitle: site.role,
  description: site.description,
  email: `mailto:${site.email}`,
  address: { '@type': 'PostalAddress', addressLocality: site.location },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-accent="green"
      suppressHydrationWarning
      className={`${display.variable} ${name.variable} ${sans.variable} ${serif.variable} ${mono.variable}`}
    >
      <head>
        {/* The dark default, so a phone's address bar is right at first
            paint. Keyed to prefers-color-scheme it gave a phone in light
            mode a cream bar over a near-black page. ThemeColor.tsx adopts
            this tag and tints it per section, theme and accent. */}
        <meta name="theme-color" content="#08060e" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ThemeProvider>
          <SmoothScroll>
            <Preloader />
            <SectionTheme />
            <ThemeColor />
            <Petals />
            <ScrollProgress />
            <KonamiEgg />
            <Telemetry />
            <Nav />
            {children}
            <Footer />
            <FocusReticle />
            <div className="noise" aria-hidden />
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
