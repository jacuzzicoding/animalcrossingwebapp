import { useState, useEffect, useRef } from 'react';

export function useSearch() {
  const [globalQuery, setGlobalQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  function pushRecentSearch(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const deduped = prev.filter(s => s !== trimmed);
      return [trimmed, ...deduped].slice(0, 10);
    });
  }

  useEffect(() => {
    if (!historyOpen) return;
    function handleOutside(e: MouseEvent) {
      if (
        historyRef.current &&
        !historyRef.current.contains(e.target as Node)
      ) {
        setHistoryOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [historyOpen]);

  return {
    globalQuery,
    setGlobalQuery,
    recentSearches,
    setRecentSearches,
    historyOpen,
    setHistoryOpen,
    historyRef,
    pushRecentSearch,
  };
}
