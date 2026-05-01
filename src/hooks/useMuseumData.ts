import { useState, useEffect, useCallback } from 'react';
import { getDataPaths } from '../lib/categoryMeta';
import { CATEGORY_ORDER } from '../lib/constants';
import type { GameId, AppErrorKind } from '../lib/types';
import type { AllData } from '../lib/viewTypes';

export type { AllData };

export function useMuseumData(gameId: GameId = 'ACGCN') {
  const [data, setData] = useState<AllData>({
    fish: [],
    bugs: [],
    fossils: [],
    art: [],
    sea_creatures: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<AppErrorKind | null>(null);

  const load = useCallback(() => {
    const paths = getDataPaths(gameId);
    setLoading(true);
    setLoadError(null);
    Promise.all(
      CATEGORY_ORDER.map(cat => {
        const path = paths[cat];
        if (!path) return Promise.resolve([]);
        return fetch(path).then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        });
      })
    )
      .then(([fish, bugs, fossils, art, sea_creatures]) => {
        setData({ fish, bugs, fossils, art, sea_creatures });
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load museum data:', err);
        const isNetwork = !navigator.onLine || err instanceof TypeError;
        setLoadError(
          isNetwork
            ? {
                type: 'networkError',
                message: 'Check your internet connection and try again.',
              }
            : {
                type: 'dataLoadFailed',
                message:
                  'Something went wrong while fetching the museum collection.',
              }
        );
        setLoading(false);
      });
  }, [gameId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, loadError, reload: load };
}
