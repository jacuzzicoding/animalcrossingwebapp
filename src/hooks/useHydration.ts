import { useEffect, useState } from 'react';
import { useAppStore } from '../lib/store';

/**
 * Returns true once Zustand persist has finished rehydrating from localStorage.
 * Gate rendering on this to prevent flash of empty state for returning users.
 */
export function useHydration(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Subscribe for the case where hydration completes after this effect runs
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    // Handle the case where hydration already completed before this effect ran
    setHydrated(useAppStore.persist.hasHydrated());
    return unsub;
  }, []);

  return hydrated;
}
