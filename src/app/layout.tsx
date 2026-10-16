import type { Metadata, Viewport } from 'next';
import {
  Bricolage_Grotesque,
  Inter,
  Instrument_Serif,
  JetBrains_Mono,
} from 'next/font/google';
import './globals.css';
import { site } from '@/lib/content';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SmoothScroll } from '@/components/providers/SmoothScroll';
import { Preloader } from '@/components/layout/Preloader';
import { ScrollProgress } from '@/components/layout/ScrollProgress';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { KonamiEgg } from '@/components/layout/KonamiEgg';
import { Petals } from '@/components/ui/Petals';
import { SectionTheme } from '@/components/providers/SectionTheme';

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
 * Dark is the default on purpose — the palette, the flow field and the grain
 * are all designed dark-first. We only switch if the visitor has explicitly
 * chosen light here before; a system preference alone does not override the
 * intended look.
 */
const themeScript = `
(function(){
  var el = document.documentElement;
  try {
    var t = localStorage.getItem('theme');
    el.dataset.theme = t === 'light' || t === 'dark' ? t : 'dark';
    var a = localStorage.getItem('accent');
    el.dataset.accent = a === 'purple' || a === 'green' ? a : 'green';
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
      className={`${display.variable} ${sans.variable} ${serif.variable} ${mono.variable}`}
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
