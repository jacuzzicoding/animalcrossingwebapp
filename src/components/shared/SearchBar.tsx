import React from 'react';
import { Search, X } from 'lucide-react';

export function SearchBar({
  query,
  setQuery,
  placeholder,
}: {
  query: string;
  setQuery: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-[14px] border px-3 py-2"
      style={{ borderColor: '#E7DAC4', backgroundColor: '#FDF9F1' }}
    >
      <Search className="w-4 h-4 opacity-50 shrink-0" />
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none text-sm"
      />
      {query && (
        <button
          onClick={() => setQuery('')}
          className="opacity-40 hover:opacity-70 shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
