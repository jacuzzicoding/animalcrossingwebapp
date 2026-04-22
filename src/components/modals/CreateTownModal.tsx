import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { type GameId, GAMES } from '../../lib/types';

export function CreateTownModal({
  onClose,
  required,
}: {
  onClose: () => void;
  required: boolean;
}) {
  const createTown = useAppStore(s => s.createTown);
  const [name, setName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState<GameId>('ACGCN');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !playerName.trim()) return;
    createTown(name.trim(), playerName.trim(), gameId);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ backgroundColor: 'rgba(42,32,20,0.55)' }}
      onClick={required ? undefined : onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4">
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
            <h2
              className="text-base font-semibold"
              style={{ color: '#F5E9D4' }}
            >
              New Town
            </h2>
            {!required && (
              <button
                onClick={onClose}
                style={{ color: '#F5E9D4', opacity: 0.7 }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: '#5a4a35' }}
              >
                Town Name
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Plumeria"
                className="w-full rounded-[10px] border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: '#E7DAC4',
                  backgroundColor: '#FFFDF6',
                  color: '#2A2A2A',
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: '#5a4a35' }}
              >
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="e.g. Brock"
                className="w-full rounded-[10px] border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: '#E7DAC4',
                  backgroundColor: '#FFFDF6',
                  color: '#2A2A2A',
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: '#5a4a35' }}
              >
                Game
              </label>
              <select
                value={gameId}
                onChange={e => setGameId(e.target.value as GameId)}
                className="w-full rounded-[10px] border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: '#E7DAC4',
                  backgroundColor: '#FFFDF6',
                  color: '#2A2A2A',
                }}
              >
                {(['ACGCN', 'ACWW', 'ACCF'] as GameId[]).map(id => (
                  <option key={id} value={id}>
                    {GAMES[id].name}
                  </option>
                ))}
              </select>
            </div>
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
              Create Town
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
