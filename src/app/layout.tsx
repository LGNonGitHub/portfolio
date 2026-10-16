import type { Metadata, Viewport } from 'next';
import {
  Bricolage_Grotesque,
  Inter,
  Instrument_Serif,
  JetBrains_Mono,
} from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
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
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#08060e' },
    { media: '(prefers-color-scheme: light)', color: '#f4f3ee' },
  ],
  width: 'device-width',
  initialScale: 1,
};

/**
 * Applied before first paint so the right theme is already on <html> and there
 * is no flash of the wrong palette.
 *
 * Light is the default because the intro sequence ends in a white-out that
 * reveals the page — the curtain hands over to a light palette rather than
 * flashing dark underneath it. A stored choice still wins; a system preference
 * alone does not.
 */
const themeScript = `
(function(){
  var el = document.documentElement;
  try {
    var t = localStorage.getItem('theme');
    el.dataset.theme = t === 'light' || t === 'dark' ? t : 'light';
    var a = localStorage.getItem('accent');
    el.dataset.accent = a === 'purple' || a === 'green' ? a : 'green';
  } catch (e) {
    el.dataset.theme = 'light';
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
      data-theme="light"
      data-accent="green"
      suppressHydrationWarning
      className={`${display.variable} ${name.variable} ${sans.variable} ${serif.variable} ${mono.variable}`}
    >
      <head>
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
            <Petals />
            <ScrollProgress />
            <KonamiEgg />
            <Telemetry />
        <Nav />
            {children}
            <Footer />
            <div className="noise" aria-hidden />
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
