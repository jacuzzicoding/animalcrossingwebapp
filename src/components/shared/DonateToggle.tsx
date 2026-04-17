import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export function DonateToggle({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={e => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={checked}
      aria-label={checked ? 'Mark as not donated' : 'Mark as donated'}
      className="shrink-0 inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-xs transition select-none"
      style={{
        backgroundColor: checked ? '#3CA370' : '#EDE3D0',
        color: checked ? '#fff' : '#2A2A2A',
        border: '1px solid #E7DAC4',
      }}
    >
      {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
      {checked ? 'Donated' : 'Donate'}
    </button>
  );
}
