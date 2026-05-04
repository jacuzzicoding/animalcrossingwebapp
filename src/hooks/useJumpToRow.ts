import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { CategoryId } from '../lib/types';

/**
 * Decision 10 helper: navigate to a category tab and jump to a specific row.
 *
 * ACCanvas owns the `highlightId` state and runs the scroll-into-view + pulse
 * effect when it changes. This hook just wires the navigation + sets the
 * highlight target. Callers (Home shelves, search dropdown) get a stable
 * `jumpTo(category, id)` function.
 */
export function useJumpToRow(
  setHighlightId: (id: string | null) => void
): (category: CategoryId, id: string) => void {
  const navigate = useNavigate();
  const { townId } = useParams<{ townId?: string }>();

  return useCallback(
    (category: CategoryId, id: string) => {
      if (!townId) return;
      // Clear first so re-jumping to the same id retriggers the pulse.
      setHighlightId(null);
      navigate(`/town/${townId}/${category}`);
      // Defer to next frame so the route + tab content mount before
      // ACCanvas's highlight effect tries to query for the row.
      requestAnimationFrame(() => {
        setHighlightId(id);
      });
    },
    [navigate, townId, setHighlightId]
  );
}
