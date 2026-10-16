/**
 * ============================================================================
 *  SITE CONTENT  —  EDIT EVERYTHING HERE
 * ============================================================================
 *  This is the only file you need to touch to make the site yours.
 *  Every line marked  // TODO  is placeholder content that should be replaced
 *  with your real information before you go live.
 * ============================================================================
 */

export const site = {
  name: 'Mohammed Mishal',
  // TODO: swap for your real domain once the Vercel project is live
  url: 'https://mohammedmishal.vercel.app',
  role: 'Designer & Developer',
  // TODO: tighten this to how you actually describe yourself
  tagline:
    'Wand in one hand, sword in the other — I design the thing, then I build it.',
  description:
    'Portfolio of Mohammed Mishal — a designer and developer crafting interfaces, interactions and systems where precision meets personality.',
  // TODO: your real location
  location: 'Kochi, India',
  timezone: 'Asia/Kolkata',
  // TODO: your real email
  email: 'hello@mohammedmishal.com',
  availability: 'Available for internships & freelance',
  availableFrom: 'Spring 2026',
  /** The organising metaphor: two disciplines, one person. */
  duality: {
    green: { label: 'Sword', discipline: 'Design', jp: '剣' },
    purple: { label: 'Wand', discipline: 'Code', jp: '杖' },
  },
} as const;

export const socials = [
  // TODO: replace every href with your real profile URLs
  { label: 'GitHub', handle: '@mishal', href: 'https://github.com' },
  { label: 'LinkedIn', handle: '/in/mishal', href: 'https://linkedin.com' },
  { label: 'Dribbble', handle: '@mishal', href: 'https://dribbble.com' },
  { label: 'X / Twitter', handle: '@mishal', href: 'https://x.com' },
  { label: 'Read.cv', handle: '/mishal', href: 'https://read.cv' },
] as const;

export const nav = [
  { label: 'Work', href: '#work', index: '01', jp: '作品' },
  { label: 'About', href: '#about', index: '02', jp: '紹介' },
  { label: 'Stack', href: '#stack', index: '03', jp: '魔法' },
  { label: 'Path', href: '#path', index: '04', jp: '軌跡' },
  { label: 'Contact', href: '#contact', index: '05', jp: '連絡' },
] as const;

/**
 * The five series this site's visual language is drawn from. Named as
 * influences only — every mark, sigil and petal here is original geometry,
 * not borrowed artwork.
 *
 * NOT CURRENTLY RENDERED. Kept here ready for the Influences section, which is
 * going in below About. See src/components/sections/Influences.tsx.
 */
export const influences = [
  {
    title: 'My Hero Academia',
    jp: '僕のヒーローアカデミア',
    took: 'Green lightning, and the idea that effort is the real quirk',
    motif: 'Kinetic energy',
  },
  {
    title: 'Black Clover',
    jp: 'ブラッククローバー',
    took: 'Grimoires and spell sigils — every project here is a page',
    motif: 'Magic circles',
  },
  {
    title: 'Sword Art Online',
    jp: 'ソードアート・オンライン',
    took: 'The HUD: status panels, stat readouts, system frames',
    motif: 'Interface as world',
  },
  {
    title: 'Fragrant Flower Blooms with Dignity',
    jp: '薫る花は凛と咲く',
    took: 'Restraint, white space, and the drifting petals',
    motif: 'Quiet grace',
  },
  {
    title: 'Wistoria: Wand and Sword',
    jp: 'ウィストリア 杖と剣のウィストリア',
    took: 'The whole thesis — wand and sword, design and code',
    motif: 'Duality',
  },
] as const;

/** The three-line statement under the hero. */
export const intro = {
  // TODO: rewrite in your own voice
  lines: [
    'A design-engineer in the making —',
    'currently studying computer science while',
    'shipping interfaces for people who care about details.',
  ],
  /** RPG-style readout under the hero. Labels are short on purpose. */
  status: [
    { label: 'Class', value: 'Design-Engineer' },
    { label: 'Affinity', value: 'Green / Purple' },
    { label: 'Status', value: 'Available' },
  ],
  // TODO: your real numbers
  stats: [
    { value: 24, suffix: '+', label: 'Projects shipped' },
    { value: 3, suffix: ' yrs', label: 'Designing & building' },
    { value: 11, suffix: '', label: 'Hackathons entered' },
    { value: 4, suffix: '', label: 'Awards & mentions' },
  ],
};

/** Words in the scrolling ticker between sections. */
export const marqueeWords = [
  'Interface Design',
  'Front-End Engineering',
  'Design Systems',
  'Motion & Interaction',
  'Prototyping',
  'Creative Development',
  'Brand Identity',
  'Accessibility',
] as const;

export type Project = {
  id: string;
  title: string;
  subtitle: string;
  year: string;
  role: string;
  category: 'Product' | 'Web' | 'Brand' | 'Experiment';
  summary: string;
  description: string;
  highlights: string[];
  stack: string[];
  /** Two hues used to render the generative project artwork. */
  palette: [string, string];
  links: { live?: string; repo?: string; caseStudy?: string };
  featured: boolean;
};

/**
 * TODO: Replace all six projects with your real work.
 * Keep the shape identical and everything else keeps working.
 */
export const projects: Project[] = [
  {
    id: 'aurora',
    title: 'Aurora',
    subtitle: 'Design system & component library',
    year: '2025',
    role: 'Design + Front-end',
    category: 'Product',
    summary:
      'A 60-component design system that cut a startup’s feature-build time roughly in half.',
    description:
      'Aurora started as a frustration: five engineers, four interpretations of the same button. I audited every surface of the product, reduced 140 one-off components down to 60 primitives, and wrote the tokens, docs and Figma library that keep them in sync. Shipping a new screen went from days to an afternoon.',
    highlights: [
      '60 primitives replacing 140 bespoke components',
      'Token pipeline syncing Figma variables to CSS custom properties',
      'Zero-runtime theming across light, dark and high-contrast',
      'Documented with live, editable usage examples',
    ],
    stack: ['React', 'TypeScript', 'Radix UI', 'Style Dictionary', 'Storybook'],
    palette: ['#3CD68C', '#06160F'],
    links: { live: '#', repo: '#', caseStudy: '#' },
    featured: true,
  },
  {
    id: 'tidal',
    title: 'Tidal',
    subtitle: 'Real-time collaborative whiteboard',
    year: '2025',
    role: 'Full-stack',
    category: 'Web',
    summary:
      'Infinite canvas with multiplayer cursors, offline support and sub-60ms sync.',
    description:
      'Tidal is a whiteboard built to survive bad wifi. State is a CRDT so edits merge without a server arbitrating, and the canvas renders on a worker-driven pipeline that keeps 60fps with thousands of nodes on screen. The hard part was never the drawing — it was making conflict resolution invisible.',
    highlights: [
      'CRDT document model with full offline editing',
      'Worker-based render pipeline holding 60fps at 5k nodes',
      'Presence, live cursors and follow-mode',
      'End-to-end encrypted room sharing',
    ],
    stack: ['Next.js', 'Yjs', 'WebRTC', 'Canvas API', 'Postgres'],
    palette: ['#A276FF', '#120A24'],
    links: { live: '#', repo: '#' },
    featured: true,
  },
  {
    id: 'meridian',
    title: 'Meridian',
    subtitle: 'Identity & site for an architecture studio',
    year: '2024',
    role: 'Design + Build',
    category: 'Brand',
    summary:
      'A full rebrand and editorial site that tripled inbound project enquiries.',
    description:
      'The studio made restrained, material-honest buildings and had a website that looked like a template. I rebuilt the identity around their drawing archive — thin rules, generous whitespace, one decisive accent — then built the site so their photography carries the page instead of competing with it.',
    highlights: [
      'Wordmark, type system and full brand guidelines',
      'Art-directed project pages with scroll-driven sequencing',
      '3.1× increase in inbound enquiries within two quarters',
      '100 Lighthouse across all four categories',
    ],
    stack: ['Next.js', 'Sanity', 'GSAP', 'Vercel'],
    palette: ['#7FE3B4', '#0A1A14'],
    links: { live: '#', caseStudy: '#' },
    featured: true,
  },
  {
    id: 'pulse',
    title: 'Pulse',
    subtitle: 'Habit tracker with a memory',
    year: '2024',
    role: 'Design + Front-end',
    category: 'Product',
    summary:
      'A habit app that stops nagging you and starts noticing patterns instead.',
    description:
      'Every habit tracker I tried punished me for missing a day. Pulse inverts that — it looks for the conditions around your streaks and surfaces them: you read more on days you walk, you skip the gym after late meetings. The visual language is a year-long heatmap you can actually read at a glance.',
    highlights: [
      'Correlation engine surfacing habit relationships',
      'Local-first storage; nothing leaves the device',
      'Fully keyboard-navigable with screen reader support',
      'Installable PWA with offline sync',
    ],
    stack: ['React', 'IndexedDB', 'D3', 'Vite', 'PWA'],
    palette: ['#C4A2FF', '#160C28'],
    links: { live: '#', repo: '#' },
    featured: false,
  },
  {
    id: 'vellum',
    title: 'Vellum',
    subtitle: 'Typography playground',
    year: '2024',
    role: 'Creative development',
    category: 'Experiment',
    summary:
      'A browser tool for pressure-testing variable fonts against real layouts.',
    description:
      'Type specimens lie. They show you a font at one size, in one context, on a white page. Vellum drops a variable font into twelve real layouts at once — a news column, a dashboard table, a hero, a caption — and lets you drag every axis while watching them all respond together.',
    highlights: [
      'Live variable-axis manipulation across 12 layouts',
      'Optical-size and grade compensation preview',
      'Shareable permalinks encoding the full font state',
      'Export as CSS custom properties',
    ],
    stack: ['Svelte', 'opentype.js', 'CSS Houdini', 'WebGL'],
    palette: ['#5BE0A8', '#071D15'],
    links: { live: '#', repo: '#' },
    featured: false,
  },
  {
    id: 'relay',
    title: 'Relay',
    subtitle: 'Campus event platform',
    year: '2023',
    role: 'Full-stack',
    category: 'Web',
    summary:
      'Built in a 36-hour hackathon, then adopted by the university for real.',
    description:
      'Relay solved an unglamorous problem: nobody knew what was happening on campus. Societies posted to four different platforms and students followed none of them. We built one feed with calendar sync and ticketing in a weekend — and then spent six months hardening it for 4,000 actual users.',
    highlights: [
      'Won Best Overall at a 36-hour hackathon',
      'Adopted by the university; 4,000+ active students',
      'Calendar sync, ticketing and capacity management',
      'Role-based admin for 40+ societies',
    ],
    stack: ['Next.js', 'Prisma', 'Postgres', 'Auth.js', 'Resend'],
    palette: ['#8E6BFF', '#0F0820'],
    links: { live: '#', repo: '#' },
    featured: false,
  },
];

export const skillGroups = [
  {
    title: 'Design',
    note: 'Where it starts',
    skills: [
      { name: 'Interface Design', level: 95 },
      { name: 'Design Systems', level: 90 },
      { name: 'Typography', level: 88 },
      { name: 'Motion & Interaction', level: 85 },
      { name: 'Brand Identity', level: 75 },
      { name: 'Prototyping', level: 92 },
    ],
  },
  {
    title: 'Engineering',
    note: 'Where it ships',
    skills: [
      { name: 'React / Next.js', level: 93 },
      { name: 'TypeScript', level: 88 },
      { name: 'CSS & Tailwind', level: 95 },
      { name: 'Node & APIs', level: 78 },
      { name: 'WebGL & Canvas', level: 70 },
      { name: 'Accessibility', level: 85 },
    ],
  },
  {
    title: 'Tools',
    note: 'Daily drivers',
    skills: [
      { name: 'Figma', level: 96 },
      { name: 'Git & GitHub', level: 90 },
      { name: 'Framer Motion', level: 88 },
      { name: 'Blender', level: 60 },
      { name: 'Vercel', level: 85 },
      { name: 'Postgres', level: 72 },
    ],
  },
] as const;

export type TimelineItem = {
  period: string;
  title: string;
  org: string;
  kind: 'work' | 'education' | 'award';
  description: string;
  tags: string[];
};

/** TODO: Replace with your real education, roles and awards. */
export const timeline: TimelineItem[] = [
  {
    period: '2025 — Present',
    title: 'Freelance Designer & Developer',
    org: 'Independent',
    kind: 'work',
    description:
      'Working directly with founders and small studios on identity, interface and front-end build. Usually the only designer and the only engineer, which means the handoff is just me talking to myself.',
    tags: ['Product Design', 'Front-end', 'Brand'],
  },
  {
    period: '2025',
    title: 'Front-End Engineering Intern',
    org: 'A product studio',
    kind: 'work',
    description:
      'Shipped three customer-facing features on a React codebase serving 50k monthly users, and rewrote the component layer that the rest of the team now builds on.',
    tags: ['React', 'TypeScript', 'Design Systems'],
  },
  {
    period: '2024',
    title: 'Best Overall — 36hr Hackathon',
    org: 'Inter-college hackathon',
    kind: 'award',
    description:
      'Built and demoed a campus events platform against 60 competing teams. It outlived the weekend and got adopted by the university.',
    tags: ['Next.js', 'Postgres', 'Team of 4'],
  },
  {
    period: '2023 — Present',
    title: 'B.Tech, Computer Science',
    org: 'Rajagiri School of Engineering & Technology',
    kind: 'education',
    description:
      'Focusing on human-computer interaction, graphics and systems. Spending roughly as much time in Figma as in the lab.',
    tags: ['HCI', 'Graphics', 'Algorithms'],
  },
  {
    period: '2023',
    title: 'Started designing seriously',
    org: 'Self-taught',
    kind: 'education',
    description:
      'Began with poster design and ended up reverse-engineering every website I admired until the CSS stopped being mysterious.',
    tags: ['Design', 'CSS', 'Curiosity'],
  },
];

export const process = [
  {
    step: '01',
    title: 'Understand',
    description:
      'Before anything gets drawn: who is this for, what breaks today, and what does winning actually look like. Most bad design is a good answer to the wrong question.',
  },
  {
    step: '02',
    title: 'Sketch',
    description:
      'Low fidelity, high volume. Twenty rough directions beat one polished guess, and the ugly ones usually contain the idea worth keeping.',
  },
  {
    step: '03',
    title: 'Build',
    description:
      'I design in the browser as early as possible. Real type, real data, real interactions — because a static mockup never has to survive a long name or a slow network.',
  },
  {
    step: '04',
    title: 'Refine',
    description:
      'The last ten percent is the part people feel. Easing curves, focus states, empty states, the thing that happens on a 320px screen at 3G.',
  },
] as const;

/** TODO: replace with real quotes, or delete the section from page.tsx. */
export const testimonials = [
  {
    quote:
      'Mishal shipped a design system in six weeks that we had been failing to build for a year. He asks better questions than most senior people I have worked with.',
    author: 'Placeholder Name',
    role: 'Engineering Lead, Placeholder Co.',
  },
  {
    quote:
      'The rare designer who actually writes the code. Nothing got lost between the mockup and production because there was no handoff to lose it in.',
    author: 'Placeholder Name',
    role: 'Founder, Placeholder Studio',
  },
  {
    quote:
      'Fast, meticulous, and genuinely pleasant to argue with about border radii. Our enquiries tripled after the rebrand.',
    author: 'Placeholder Name',
    role: 'Director, Placeholder Architects',
  },
] as const;
