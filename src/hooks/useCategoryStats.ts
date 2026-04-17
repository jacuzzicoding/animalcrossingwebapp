import { useMemo } from 'react';
import { CATEGORY_ORDER } from '../lib/constants';
import type { CategoryId } from '../lib/types';
import type { AnyItem } from '../lib/utils';
import type { AllData } from '../lib/viewTypes';

export function useCategoryStats(
  data: AllData,
  donated: Record<string, boolean>
): Record<CategoryId, number> {
  return useMemo(() => {
    const counts = { fish: 0, bugs: 0, fossils: 0, art: 0 } as Record<
      CategoryId,
      number
    >;
    for (const cat of CATEGORY_ORDER) {
      counts[cat] = (data[cat] as AnyItem[]).filter(
        item => !!donated[item.id]
      ).length;
    }
    return counts;
  }, [data, donated]);
}
