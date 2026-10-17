'use client';

import { useSyncExternalStore } from 'react';
import {
  SERVER_DEFAULT,
  getClock,
  runtime,
  subscribeClock,
  type State,
} from '@/lib/runtime';

/**
 * Read a slice of the runtime store. Re-renders only when the selected value
 * changes, so select primitives (`s => s.section`), not new objects.
 *
 * The server snapshot is SERVER_DEFAULT, which is what layout.tsx renders on
 * <html>; hydration therefore matches, and the client's real values (a stored
 * light theme, 静) arrive in the render straight after.
 */
export function useRuntime<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    runtime.subscribe,
    () => selector(runtime.get()),
    () => selector(SERVER_DEFAULT),
  );
}

/** The shared IST clock as "HH:MM:SS". Empty on the server and until the
 *  first tick, so no time is ever baked into the static HTML. */
export function useClock() {
  return useSyncExternalStore(subscribeClock, getClock, () => '');
}
