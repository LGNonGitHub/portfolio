'use client';

import { Component, type ReactNode } from 'react';

/**
 * A class error boundary, because hooks cannot catch a render throw.
 *
 * It exists for the optional spectacle — the GL stage, the pipeline bench,
 * the summons seal. Any of those failing should cost you that one ornament,
 * not the page: React unmounts the whole tree on an uncaught render error,
 * so without this a WebGL context lost on a tired phone replaces the site
 * with Next's bare "Application error" screen.
 */
export class Boundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Logged, not swallowed silently — the console is where this gets found.
    console.error('[boundary]', error);
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
