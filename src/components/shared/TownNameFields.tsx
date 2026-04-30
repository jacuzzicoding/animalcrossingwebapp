import React from 'react';

interface Props {
  name: string;
  playerName: string;
  onNameChange: (v: string) => void;
  onPlayerNameChange: (v: string) => void;
  namePlaceholder?: string;
  playerPlaceholder?: string;
  autoFocus?: boolean;
}

const inputStyle = {
  borderColor: '#E7DAC4',
  backgroundColor: '#FFFDF6',
  color: '#2A2A2A',
};

const labelStyle = { color: '#5a4a35' };

export function TownNameFields({
  name,
  playerName,
  onNameChange,
  onPlayerNameChange,
  namePlaceholder,
  playerPlaceholder,
  autoFocus = true,
}: Props) {
  return (
    <>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={labelStyle}>
          Town Name
        </label>
        <input
          autoFocus={autoFocus}
          type="text"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder={namePlaceholder}
          className="w-full rounded-[10px] border px-3 py-2 text-sm outline-none"
          style={inputStyle}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={labelStyle}>
          Your Name
        </label>
        <input
          type="text"
          value={playerName}
          onChange={e => onPlayerNameChange(e.target.value)}
          placeholder={playerPlaceholder}
          className="w-full rounded-[10px] border px-3 py-2 text-sm outline-none"
          style={inputStyle}
        />
      </div>
    </>
  );
}
