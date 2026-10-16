import { Hero } from '@/components/sections/Hero';
import { Ticker } from '@/components/sections/Ticker';
import { Projects } from '@/components/sections/Projects';
import { About } from '@/components/sections/About';
import { Skills } from '@/components/sections/Skills';
import { Process } from '@/components/sections/Process';
import { Timeline } from '@/components/sections/Timeline';
import { Contact } from '@/components/sections/Contact';

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <Ticker />
      <Projects />
      <About />
      <Ticker reverse />
      <Skills />
      <Process />
      <Timeline />
      {/* Influences (the five series) is written and ready at
          src/components/sections/Influences.tsx but intentionally not rendered
          yet — it is going below the About section. To restore it, import it
          and drop <Influences /> wherever it should sit. */}
      <Contact />
    </main>
  );
}
