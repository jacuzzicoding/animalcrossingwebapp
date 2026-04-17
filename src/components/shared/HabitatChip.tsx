import React from 'react';

export function HabitatChip({ label }: { label: string }) {
  return (
    <span
      className="inline-block px-2 py-0.5 text-[11px] rounded-[10px] shrink-0"
      style={{
        backgroundColor: '#F5E9D4',
        border: '1px solid #E7DAC4',
        color: '#5a4a35',
      }}
    >
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  );
}
