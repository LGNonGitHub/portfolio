'use client';

import { useSyncExternalStore } from 'react';
import { CAST_EVENT, getCastPhase, type CastPhase } from '@/lib/cast';

function subscribe(onChange: () => void) {
  window.addEventListener(CAST_EVENT, onChange);
  return () => window.removeEventListener(CAST_EVENT, onChange);
}

/**
 * The intro's phase, kept in sync with html[data-cast].
 *
 * The server snapshot is 'done' because the server cannot know whether this
 * tab has already seen the intro. Anything that renders differently while the
 * cast plays should therefore lean on CSS (prologue.css keys off the same
 * attribute before hydration) and use this hook only for behaviour.
 */
export function useCastPhase(): CastPhase {
  return useSyncExternalStore(subscribe, getCastPhase, () => 'done');
}
