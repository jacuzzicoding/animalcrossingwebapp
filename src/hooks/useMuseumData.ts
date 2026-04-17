import { useState, useEffect } from 'react';
import { CATEGORY_META } from '../lib/categoryMeta';
import { CATEGORY_ORDER } from '../lib/constants';
import type { AppErrorKind } from '../lib/types';
import type { AllData } from '../lib/viewTypes';

export type { AllData };

export function useMuseumData() {
  const [data, setData] = useState<AllData>({ fish: [], bugs: [], fossils: [], art: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<AppErrorKind | null>(null);

  function load() {
    setLoading(true);
    setLoadError(null);
    Promise.all(
      CATEGORY_ORDER.map(cat =>
        fetch(CATEGORY_META[cat].file).then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
      )
    )
      .then(([fish, bugs, fossils, art]) => {
        setData({ fish, bugs, fossils, art });
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load museum data:', err);
        const isNetwork = !navigator.onLine || err instanceof TypeError;
        setLoadError(
          isNetwork
            ? { type: 'networkError', message: 'Check your internet connection and try again.' }
            : { type: 'dataLoadFailed', message: 'Something went wrong while fetching the museum collection.' }
        );
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  return { data, loading, loadError, reload: load };
}
