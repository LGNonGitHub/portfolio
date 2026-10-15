'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useMediaQuery';

/**
 * Masked line-by-line reveal. Each line sits inside an overflow-hidden box and
 * slides up from below as it scrolls into view.
 *
 * Note: the viewport check runs on the *outer* element, not the sliding one.
 * The sliding span starts fully outside its clip mask, so an observer on it
 * would report "not intersecting" forever and the text would never appear.
 */
export function TextReveal({
  text,
  className,
  lineClassName,
  delay = 0,
  as: Tag = 'div',
  once = true,
}: {
  text: string | string[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  as?: 'div' | 'h1' | 'h2' | 'h3' | 'p';
  once?: boolean;
}) {
  const lines = Array.isArray(text) ? text : [text];
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: '0px 0px -12% 0px' });

  if (reduced) {
    return (
      <Tag className={className}>
        {lines.map((line, i) => (
          <span key={i} className={cn('block', lineClassName)}>
            {line}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag className={className}>
      {/* Zero-height probe that is never clipped — this is what we observe. */}
      <span ref={ref} aria-hidden className="block h-0 w-full" />
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span
            className={cn('block', lineClassName)}
            initial={{ y: '110%' }}
            animate={inView ? { y: '0%' } : { y: '110%' }}
            transition={{
              duration: 1,
              ease: [0.16, 1, 0.3, 1],
              delay: delay + i * 0.08,
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/**
 * Character-level reveal for short, high-impact strings (the hero name).
 * Splits on words first so wrapping stays natural.
 */
export function CharReveal({
  text,
  className,
  delay = 0,
  stagger = 0.028,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const reduced = useReducedMotion();
  const words = text.split(' ');

  if (reduced) return <span className={className}>{text}</span>;

  let index = 0;

  return (
    <span className={cn('inline-flex flex-wrap', className)} aria-label={text}>
      {words.map((word, w) => (
        <span
          key={w}
          className={cn(
            'inline-flex overflow-hidden pb-[0.08em]',
            w < words.length - 1 && 'pr-[0.22em]',
          )}
        >
          {Array.from(word).map((char) => {
            const i = index++;
            return (
              <motion.span
                key={i}
                aria-hidden
                className="inline-block will-change-transform"
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                transition={{
                  duration: 1.05,
                  ease: [0.16, 1, 0.3, 1],
                  delay: delay + i * stagger,
                }}
              >
                {char}
              </motion.span>
            );
          })}
        </span>
      ))}
    </span>
  );
}
