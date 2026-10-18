import { Hero } from '@/components/sections/Hero';
import { Projects } from '@/components/sections/Projects';
import { About } from '@/components/sections/About';
import { Skills } from '@/components/sections/Skills';
import { Timeline } from '@/components/sections/Timeline';
import { Hobbies } from '@/components/sections/Hobbies';
import { Contact } from '@/components/sections/Contact';

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <Projects />
      <About />
      <Skills />
      <Timeline />
      <Hobbies />
      {/* Process.tsx is kept but not rendered — restore with one line: <Process /> after <Skills />. */}
      <Contact />
    </main>
  );
}
