'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsTouch, useReducedMotion } from '@/hooks/useMediaQuery';

/** 3D tilt-toward-pointer card with a travelling specular highlight. */
export function Tilt({
  children,
  className,
  max = 9,
  glare = true,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();
  const enabled = !isTouch && !reduced;

  const onMove = (e: React.MouseEvent) => {
    if (!enabled || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setT({
      rx: (0.5 - py) * max * 2,
      ry: (px - 0.5) * max * 2,
      gx: px * 100,
      gy: py * 100,
      active: true,
    });
  };

  const reset = () => setT({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });

  return (
    <div ref={ref} className={cn('perspective', className)} onMouseMove={onMove} onMouseLeave={reset}>
      <motion.div
        className="preserve-3d relative h-full w-full"
        animate={{ rotateX: t.rx, rotateY: t.ry }}
        transition={{ type: 'spring', stiffness: 170, damping: 20, mass: 0.6 }}
      >
        {children}
        {glare && enabled && (
          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
            style={{
              opacity: t.active ? 1 : 0,
              background: `radial-gradient(420px circle at ${t.gx}% ${t.gy}%, rgb(var(--fg) / 0.09), transparent 62%)`,
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
