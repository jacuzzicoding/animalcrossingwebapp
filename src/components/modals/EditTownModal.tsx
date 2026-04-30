import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { TownNameFields } from '../shared/TownNameFields';

interface Props {
  isOpen: boolean;
  town: { id: string; name: string; playerName: string } | null;
  onClose: () => void;
}

export function EditTownModal({ isOpen, town, onClose }: Props) {
  const updateTown = useAppStore(s => s.updateTown);
  const [name, setName] = useState('');
  const [playerName, setPlayerName] = useState('');

  // Sync form state when a different town is opened for editing.
  // Depend on the stable primitive id so the effect only fires when the town
  // actually changes, not on every parent re-render.
  const townId = town?.id;
  const townName = town?.name;
  const townPlayerName = town?.playerName;
  useEffect(() => {
    if (townId) {
      setName(townName ?? '');
      setPlayerName(townPlayerName ?? '');
    }
  }, [townId, townName, townPlayerName]);

  if (!isOpen || !town) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !playerName.trim() || !town) return;
    updateTown(town.id, name.trim(), playerName.trim());
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(42,32,20,0.55)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[20px] overflow-hidden"
        style={{ backgroundColor: '#FDF9F1', border: '1px solid #E7DAC4' }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            background: 'linear-gradient(180deg, #7B5E3B 0%, #6e5234 100%)',
          }}
        >
          <h2 className="text-base font-semibold" style={{ color: '#F5E9D4' }}>
            Edit Town
          </h2>
          <button onClick={onClose} style={{ color: '#F5E9D4', opacity: 0.7 }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <TownNameFields
            name={name}
            playerName={playerName}
            onNameChange={setName}
            onPlayerNameChange={setPlayerName}
          />
          <button
            type="submit"
            disabled={!name.trim() || !playerName.trim()}
            className="w-full py-3 rounded-[12px] text-sm font-semibold transition"
            style={{
              backgroundColor:
                name.trim() && playerName.trim() ? '#3CA370' : '#D9CCBA',
              color: '#fff',
            }}
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
