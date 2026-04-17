import React from 'react';

export function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="rounded-[14px] border px-4 py-8 text-center text-sm"
      style={{
        borderColor: '#E7DAC4',
        backgroundColor: '#FFFDF6',
        color: '#5a4a35',
      }}
    >
      {message}
    </div>
  );
}
