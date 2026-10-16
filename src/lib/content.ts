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
  name: 'Mohammed Mishal M',
  /** Display form for the hero, split across two lines. */
  nameLines: ['Mohammed', 'Mishal'],
  // TODO: swap for your real domain once the Vercel project is live
  url: 'https://mohammedmishal.vercel.app',
  role: 'B.Tech Student / Information Technology',
  tagline:
    'Studying IT, building software, and shooting everything in between — developer, designer, and a camera that never quite gets put down.',
  description:
    'Portfolio of Mohammed Mishal M — B.Tech Information Technology student at Rajagiri School of Engineering and Technology, working across software development, design, photography and videography.',
  location: 'Palakkad, Kerala',
  timezone: 'Asia/Kolkata',
  email: 'Mohammedmishal554@gmail.com',
  availability: 'Open to internships & freelance',
  availableFrom: 'Graduating 2029',
  /** The organising metaphor: two disciplines, one person. */
  duality: {
    green: { label: 'Sword', discipline: 'Design', jp: '剣' },
    purple: { label: 'Wand', discipline: 'Code', jp: '杖' },
  },
} as const;

export const socials = [
  { label: 'GitHub', handle: '@MishalxRSET', href: 'https://github.com/MishalxRSET' },
  {
    label: 'LinkedIn',
    handle: '/in/mohammed-mishal-m',
    href: 'https://www.linkedin.com/in/mohammed-mishal-m-457271349',
  },
  {
    label: 'Instagram',
    handle: '@gearshift.overdrive',
    href: 'https://instagram.com/gearshift.overdrive',
  },
  { label: 'Discord', handle: 'lgnserop', href: 'https://discord.com/users/lgnserop' },
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
    'Second-year B.Tech student in Information Technology',
    'at Rajagiri School of Engineering and Technology,',
    'heading toward software development and design.',
  ],
  /** RPG-style readout under the hero. Labels are short on purpose. */
  status: [
    { label: 'Course', value: 'B.Tech IT' },
    { label: 'Year', value: '2nd · RSET' },
    { label: 'Status', value: 'Open to internships' },
  ],
  // TODO: your real numbers
  stats: [
    { value: 2, suffix: '', label: 'Projects built' },
    { value: 3, suffix: ' yrs', label: 'Designing & building' },
    { value: 6, suffix: '', label: 'Hackathons entered' },
    { value: 5, suffix: '', label: 'Awards' },
  ],
};

/** Words in the scrolling ticker between sections. */
export const marqueeWords = [
  'Software Development',
  'Java',
  'Python',
  'Interface Design',
  'Photography',
  'Videography',
  'Team Management',
  'Film & Media',
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
 * TODO — Mishal: these two are STUBS, not your work. Your GitHub
 * (github.com/MishalxRSET) has no public repositories, so there was nothing to
 * read. For each project tell me: what it does, what you built it with, what
 * was hard about it, and any live link or repo — then I'll write them properly.
 *
 * Until then the Work section is honest but thin, which is the right trade.
 */
export const projects: Project[] = [
  {
    id: 'project-one',
    title: 'Project One',
    subtitle: 'Add a one-line description',
    year: '2025',
    role: 'TODO',
    category: 'Product',
    summary: 'TODO — one sentence on what this is and who it is for.',
    description:
      'TODO — the real story: what problem it solved, what you chose to build it with and why, and the part that took longest to get right.',
    highlights: [
      'TODO — something concrete you made work',
      'TODO — a constraint you designed around',
    ],
    stack: ['TODO'],
    palette: ['#3CD68C', '#06160F'],
    links: {},
    featured: true,
  },
  {
    id: 'project-two',
    title: 'Project Two',
    subtitle: 'Add a one-line description',
    year: '2025',
    role: 'TODO',
    category: 'Web',
    summary: 'TODO — one sentence on what this is and who it is for.',
    description:
      'TODO — the real story: what problem it solved, what you chose to build it with and why, and the part that took longest to get right.',
    highlights: [
      'TODO — something concrete you made work',
      'TODO — a constraint you designed around',
    ],
    stack: ['TODO'],
    palette: ['#A276FF', '#120A24'],
    links: {},
    featured: true,
  },
];

/**
 * TODO — Mishal: the numbers below are MY estimates, not yours. Go through and
 * set each one to what you'd actually be comfortable defending in an interview.
 * Anything you've only touched in a lab belongs under 50.
 */
export const skillGroups = [
  {
    title: 'Code',
    note: 'What I build with',
    skills: [
      { name: 'Java', level: 70 },
      { name: 'Python', level: 70 },
      { name: 'HTML & CSS', level: 65 },
      { name: 'JavaScript', level: 50 },
      { name: 'Git & GitHub', level: 55 },
      { name: 'Data Structures', level: 55 },
    ],
  },
  {
    title: 'Creative',
    note: 'Camera in hand',
    skills: [
      { name: 'Photography', level: 80 },
      { name: 'Videography', level: 75 },
      { name: 'Video Editing', level: 70 },
      { name: 'Interface Design', level: 55 },
      { name: 'Colour & Grading', level: 60 },
      { name: 'Storyboarding', level: 55 },
    ],
  },
  {
    title: 'Working',
    note: 'With other people',
    skills: [
      { name: 'Team Management', level: 75 },
      { name: 'Communication', level: 75 },
      // TODO: name the actual languages you speak.
      { name: 'Multilingual', level: 80 },
      { name: 'Event & Club Work', level: 70 },
      { name: 'Problem Solving', level: 65 },
      { name: 'Presenting', level: 60 },
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

export const timeline: TimelineItem[] = [
  {
    period: '2025 — 2029',
    title: 'B.Tech, Information Technology',
    org: 'Rajagiri School of Engineering & Technology',
    kind: 'education',
    description:
      'Currently in second year, working toward software development and design. Part of the Media and Film Club, which is where the camera work keeps finding its way back in.',
    tags: ['Information Technology', 'Media & Film Club', 'Graduating 2029'],
  },
  {
    // TODO: replace with the actual months you worked there.
    period: '2025',
    title: 'Intern',
    org: 'InternVision — remote',
    kind: 'work',
    description:
      'First paid role, worked fully remote, with a stipend of ₹10,000. TODO: add what you actually built or worked on here — this is the line a recruiter reads first.',
    tags: ['Remote', 'Paid internship'],
  },
  {
    period: '2023 — 2025',
    title: 'Higher Secondary, 11th & 12th',
    org: 'Bharathamatha CMI Public School, Palakkad',
    kind: 'education',
    description:
      'Two years that pulled in two directions at once — coursework on one side, the school Film Club on the other. The Film Club is where the photography and videography started properly.',
    tags: ['Film Club', 'Palakkad'],
  },
  {
    period: '2010 — 2023',
    title: 'Pre-KG through 10th',
    org: 'Chinmaya Vidyalaya Tattamangalam, Palakkad',
    kind: 'education',
    description:
      'Thirteen years at one school. Long enough that most of what I am stubborn about started here.',
    tags: ['Palakkad'],
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
