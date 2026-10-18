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
  nameKana: '' as string, // TODO — Mishal: your name in katakana for the hero lockup (e.g. モハメド・ミシャル). Empty renders nothing.
  url: 'https://lgnserr.vercel.app',
  role: 'B.Tech Student / Information Technology',
  tagline:
    'Studying IT, building software, and shooting everything in between — developer, designer, and a camera that never quite gets put down.',
  description:
    'Portfolio of Mohammed Mishal M — B.Tech Information Technology student at Rajagiri School of Engineering and Technology, working across software development, design, photography and videography.',
  location: 'Kochi, Kerala',
  /** For the telemetry strip, where space is counted in characters. */
  locationShort: 'Kochi, IN',
  /** Kochi: 9.9312°N, 76.2673°E. */
  coords: '09°55′N 76°16′E',
  /** Stamped at build time by next.config.mjs — see NEXT_PUBLIC_BUILD. */
  build: process.env.NEXT_PUBLIC_BUILD ?? 'dev',
  /** Home, as opposed to where the hostel is. */
  hometown: 'Palakkad, Kerala',
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
  { label: 'Hobby', href: '#hobby', index: '05', jp: '趣味' },
  { label: 'Contact', href: '#contact', index: '06', jp: '連絡' },
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
    { value: 2, suffix: '', label: 'Projects built', note: 'CarbonZero · PictoTrack', href: '#work' },
    { value: 3, suffix: ' yrs', label: 'Designing & building', note: 'Since 2023', href: '#path' },
    { value: 6, suffix: '', label: 'Hackathons entered', note: 'ACM · iTrax · CSI · Abhiyanthriki', href: '#path-hackathons' },
    { value: 5, suffix: '', label: 'Awards', note: 'From those six events', href: '#path-hackathons' },
  ],
};

/**
 * The intro's trajectory: the same milestones the Ascent section lists, drawn
 * as a path across the years so the loader is about him rather than decoration.
 *
 * The line itself carries no quantity and the chart has no y-axis — it is a
 * timeline, not a measurement, and it should not pretend otherwise.
 */
export const introTrack = {
  from: 2010,
  to: 2029,
  marks: [
    { year: 2010, label: 'Chinmaya Vidyalaya', y: 235 },
    { year: 2023, label: 'Film Club · Bharathamatha', y: 180 },
    { year: 2025, label: 'B.Tech IT · RSET', y: 120 },
    { year: 2026, label: 'CarbonZero', y: 86 },
    { year: 2029, label: 'Graduating', y: 24 },
  ],
} as const;

/** Words in the scrolling ticker between sections. */
/**
 * Which series each scroll section is themed after, and the emblem that marks
 * it. The emblems are original marks — see SectionEmblem.tsx — rather than
 * anyone's character art, because this site is deployed publicly.
 */
export const sectionThemes = {
  work: { series: 'Black Clover', emblem: 'grimoire' },
  about: { series: 'My Hero Academia', emblem: 'bolt' },
  stack: { series: 'Wistoria: Wand and Sword', emblem: 'wandsword' },
  path: { series: 'Sword Art Online', emblem: 'tower' },
  contact: { series: 'Fragrant Flower Blooms with Dignity', emblem: 'blossom' },
} as const;

/**
 * The Hobby section.
 *
 * TODO — Mishal: I wrote these from what you have told me across our chats.
 * Anything wrong, cut it; anything missing, say so. The two marked UNCONFIRMED
 * are guesses from your handles and nothing else — delete them if they are off.
 */
export const hobbies = [
  {
    title: 'Photography',
    jp: '写真',
    blurb:
      'The thing I will always stop for. It started in the school Film Club and never really stopped — if I am going somewhere, the camera is coming.',
    tags: ['Stills', 'Low light', 'Street'],
  },
  {
    title: 'Videography & editing',
    jp: '映像',
    blurb:
      'Shooting is half of it; the cut is where it actually becomes something. Currently with the Media and Film Club at RSET.',
    tags: ['Shooting', 'Editing', 'Colour'],
  },
  {
    title: 'Anime',
    jp: 'アニメ',
    blurb:
      'Enough that the whole look of this site came out of it. Five favourites below — one for every section you just scrolled past.',
    tags: ['Shonen', 'Isekai', 'Slice of life'],
  },
  {
    title: 'Learning Japanese & Korean',
    jp: '語学',
    blurb:
      'Japanese is further along; Korean is early days. Both mostly self-taught, both slower than I would like.',
    tags: ['日本語', '한국어', 'Self-taught'],
  },
  {
    title: 'Hackathons & CTFs',
    jp: '競技',
    blurb:
      'Six so far. The appeal is the deadline — you find out quickly what you actually know when there are eighteen hours left.',
    tags: ['Teams', 'All-nighters', 'Shipping'],
  },
  {
    title: 'Building things',
    jp: '制作',
    blurb:
      'Side projects as an excuse to learn whatever I have been avoiding. This site is one of them.',
    tags: ['Java', 'Python', 'Web'],
  },
] as const;

/** The five the sections are themed after, in his own order. */
export const favouriteAnime = [
  { title: 'My Hero Academia', jp: '僕のヒーローアカデミア' },
  { title: 'Black Clover', jp: 'ブラッククローバー' },
  { title: 'Sword Art Online', jp: 'ソードアート・オンライン' },
  { title: 'The Fragrant Flower Blooms with Dignity', jp: '薫る花は凛と咲く' },
  { title: 'Wistoria: Wand and Sword', jp: '杖と剣のウィストリア' },
] as const;

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
 * Written from the CarbonZero repo and the live deployment. TODO — Mishal:
 * check the claims marked below, and add a repo link for PictoTrack if you
 * push it.
 */
export const projects: Project[] = [
  {
    id: 'carbonzero',
    title: 'CarbonZero',
    subtitle: 'Carbon footprint calculator & reduction planner',
    year: '2026',
    role: 'Developer',
    category: 'Product',
    summary:
      'A household emissions calculator that does not stop at the number — it builds you a reduction plan and lets you take it with you.',
    description:
      'Most footprint calculators hand you a figure and leave you with it. CarbonZero works out household emissions, then generates actionable mitigation pathways from them, charts the result, and exports the plan as a PDF or straight to Google Drive. Built this semester as my ESSE course project in S3 at RSET, and running live on Vercel, with Gemini generating the reduction blueprints and Firestore holding the data.',
    highlights: [
      'Emission reduction blueprints generated per household via the Gemini API',
      'Interactive 3D scenes built with Three.js and react-three-fiber',
      'Charted breakdowns with Recharts, exportable to PDF or Google Drive',
      'Firebase/Firestore backend behind an Express server, deployed on Vercel',
    ],
    stack: [
      'React 19', 'TypeScript', 'Vite', 'Tailwind', 'Firebase',
      'Gemini API', 'Three.js', 'Recharts', 'Express',
    ],
    palette: ['#3CD68C', '#06160F'],
    links: {
      live: 'https://carbon-footprint-calc-v5.vercel.app/',
      repo: 'https://github.com/MishalxRSET/CarbonFootprintCalc',
    },
    featured: true,
  },
  {
    id: 'pictotrack',
    title: 'PictoTrack',
    subtitle: 'Image location finder — OCR, EXIF and maps',
    year: '2025',
    role: 'Developer',
    category: 'Product',
    summary:
      'Hand it a photo and it works out where the photo was taken — reading the text in the frame first, and falling back to the GPS hidden in the file.',
    description:
      'My 12th-standard science batch course project: a desktop app in Python that answers one question — where was this taken? It tries two independent routes. First OCR — OpenCV cleans the image up with greyscale, Otsu thresholding and dilation, Tesseract reads whatever text is in the frame, and that string gets geocoded through Nominatim. If nothing usable comes back, it falls back to the EXIF GPS block, converting the degrees-minutes-seconds values into decimal coordinates and flipping sign for the southern and western hemispheres. Either way the result is reverse-geocoded to a readable address and plotted on a Google map, viewable in-app or in the browser. Behind all of it sits a MySQL-backed login with bcrypt-hashed passwords.',
    highlights: [
      'Two-strategy location pipeline: OCR first, EXIF GPS as the fallback',
      'OpenCV preprocessing — greyscale, Otsu threshold, dilation — before Tesseract reads the frame',
      'Forward and reverse geocoding via Nominatim; DMS to decimal with hemisphere handling',
      'MySQL accounts with bcrypt hashing, including the 72-byte bcrypt input limit',
      'Generated maps open in an embedded viewer or the system browser',
    ],
    stack: [
      'Python', 'CustomTkinter', 'OpenCV', 'Tesseract OCR', 'Pillow',
      'geopy / Nominatim', 'gmplot', 'MySQL', 'bcrypt',
    ],
    palette: ['#A276FF', '#120A24'],
    // TODO: add the repo link once PictoTrack is pushed to GitHub.
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
      { name: 'Python', level: 85 },
      { name: 'HTML & CSS', level: 65 },
      { name: 'React & TypeScript', level: 60 },
      { name: 'Git & GitHub', level: 55 },
      { name: 'Data Structures', level: 55 },
    ],
  },
  {
    title: 'Creative',
    note: 'Camera in hand',
    skills: [
      { name: 'Photography', level: 100 },
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
      { name: 'English · Hindi · Malayalam', level: 90 },
      // TODO: set this to where your Japanese actually is — I guessed.
      { name: 'Japanese', level: 60 },
      { name: 'Korean (beginner)', level: 20 },
      { name: 'Event & Club Work', level: 70 },
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
      'Currently in S3, the first semester of second year, working toward software development and design. Part of the Media and Film Club, which is where the camera work keeps finding its way back in.',
    tags: ['Information Technology', 'Media & Film Club', 'Graduating 2029'],
  },
  {
    period: '2025 — 26',
    title: 'Intern',
    org: 'InternVision — remote',
    kind: 'work',
    description:
      'Taken over the semester break straight after S1. First paid role, fully remote, with a ₹10,000 stipend. Worked through advanced Python and delivered both a mini project and a course project to earn it.',
    tags: ['Python', 'Remote', 'S1 semester break'],
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

/**
 * The six behind the hero counter. Rendered at the foot of the Path section
 * rather than in a section of their own.
 *
 * TODO — Mishal: add the organiser for Crushing Depth if it had one, and say
 * which of these you placed in so the awards count has something behind it too.
 */
export const hackathons = [
  { name: 'FrostByte', org: 'ACM RSET' },
  { name: 'Adaptathon', org: 'iTrax RSET' },
  { name: 'Crushing Depth', org: 'Capture the Flag' },
  { name: 'Cache Quest', org: 'CSI SB RSET' },
  { name: 'Code Quest 2.0', org: 'ABHIYANTHRIKI 2025' },
  { name: 'Overclocked', org: 'ABHIYANTHRIKI 2025' },
] as const;

/**
 * Attribution for everything on this site that belongs to someone else.
 *
 * Studio and creator credits were verified rather than recalled — getting an
 * attribution wrong is worse than not giving one.
 */
export const credits = {
  intro:
    'The visual language of this site is inspired by the series below. All titles, characters and artwork remain the property of their respective creators, studios and licensors. This site is a personal portfolio, is not affiliated with or endorsed by any of them, and claims no ownership of their work.',
  series: [
    {
      title: 'My Hero Academia',
      jp: '僕のヒーローアカデミア',
      creator: 'Kōhei Horikoshi',
      studio: 'Bones',
      section: 'About',
    },
    {
      title: 'Black Clover',
      jp: 'ブラッククローバー',
      creator: 'Yūki Tabata',
      studio: 'Studio Pierrot',
      section: 'Work',
    },
    {
      title: 'Sword Art Online',
      jp: 'ソードアート・オンライン',
      creator: 'Reki Kawahara',
      studio: 'A-1 Pictures',
      section: 'Path',
    },
    {
      title: 'The Fragrant Flower Blooms with Dignity',
      jp: '薫る花は凛と咲く',
      creator: 'Saka Mikami',
      studio: 'CloverWorks',
      section: 'Contact',
    },
    {
      title: 'Wistoria: Wand and Sword',
      jp: 'ウィストリア 杖と剣の物語',
      creator: 'Fujino Ōmori & Toshi Aoi',
      studio: 'Actas / Bandai Namco Pictures',
      section: 'Stack',
    },
  ],
  assets: [
    {
      what: 'Section artwork',
      detail:
        'Promotional and character art belonging to the studios and licensors credited above. Used without permission or claim of ownership.',
    },
    {
      what: 'Display typeface',
      detail: 'Japan Ramen by Makna Studio — personal-use licence.',
      href: 'https://maknastudio.com/product/japan-ramen/',
    },
    {
      what: 'Everything else',
      detail:
        'The intro, sigils, emblems, petals and the particle field are original geometry drawn for this site.',
    },
    {
      what: 'Stroke order',
      detail:
        'Kanji stroke data from KanjiVG by Ulrich Apel, CC BY-SA 3.0; the derived stroke file is shared under the same licence.',
      href: 'https://kanjivg.tagaini.net/',
    },
    {
      what: 'Japanese & condensed type',
      detail:
        'Shippori Mincho B1 (FONTDASU) and a condensed instance of Bricolage Grotesque, both under the SIL Open Font License.',
      href: 'https://fonts.google.com/specimen/Shippori+Mincho+B1',
    },
  ],
} as const;

export const processSteps = [
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
