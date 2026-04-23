import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameId } from './types';
import { migrateStore } from './storeMigrations';

export type Hemisphere = 'NH' | 'SH';

export interface Town {
  id: string;
  name: string;
  playerName: string;
  gameId: GameId;
  hemisphere: Hemisphere;
  createdAt: string;
}

interface AppState {
  towns: Town[];
  activeTownId: string | null;
  // donated[townId][gameId][itemId] = true
  donated: Record<string, Record<string, Record<string, boolean>>>;
  // donatedAt[townId][gameId][itemId] = ISO string
  donatedAt: Record<string, Record<string, Record<string, string>>>;

  createTown: (name: string, playerName: string, gameId?: GameId) => Town;
  updateTown: (id: string, name: string, playerName: string) => void;
  setTownHemisphere: (id: string, hemisphere: Hemisphere) => void;
  setActiveTown: (id: string) => void;
  deleteTown: (id: string) => void;
  toggle: (itemId: string) => void;
  isDonated: (itemId: string) => boolean;
  getDonatedAt: (itemId: string) => string | undefined;
  getActiveTown: () => Town | undefined;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      towns: [],
      activeTownId: null,
      donated: {},
      donatedAt: {},

      createTown: (name, playerName, gameId = 'ACGCN') => {
        const town: Town = {
          id: generateId(),
          name,
          playerName,
          gameId,
          hemisphere: 'NH',
          createdAt: new Date().toISOString(),
        };
        set(state => ({
          towns: [...state.towns, town],
          activeTownId: town.id,
        }));
        return town;
      },

      updateTown: (id, name, playerName) =>
        set(state => ({
          towns: state.towns.map(t =>
            t.id === id ? { ...t, name, playerName } : t
          ),
        })),

      setTownHemisphere: (id, hemisphere) =>
        set(state => ({
          towns: state.towns.map(t => (t.id === id ? { ...t, hemisphere } : t)),
        })),

      setActiveTown: id => set({ activeTownId: id }),

      deleteTown: id =>
        set(state => {
          const towns = state.towns.filter(t => t.id !== id);
          const donated = { ...state.donated };
          const donatedAt = { ...state.donatedAt };
          delete donated[id];
          delete donatedAt[id];
          const activeTownId =
            state.activeTownId === id
              ? (towns[0]?.id ?? null)
              : state.activeTownId;
          return { towns, donated, donatedAt, activeTownId };
        }),

      toggle: itemId =>
        set(state => {
          const { activeTownId } = state;
          if (!activeTownId) return state;
          const activeTown = state.towns.find(t => t.id === activeTownId);
          if (!activeTown) return state;
          const { gameId } = activeTown;

          const townDonated = { ...(state.donated[activeTownId] ?? {}) };
          const townDonatedAt = { ...(state.donatedAt[activeTownId] ?? {}) };
          const gameDonated = { ...(townDonated[gameId] ?? {}) };
          const gameDonatedAt = { ...(townDonatedAt[gameId] ?? {}) };

          const nowDonated = !gameDonated[itemId];
          if (nowDonated) {
            gameDonated[itemId] = true;
            gameDonatedAt[itemId] = new Date().toISOString();
          } else {
            delete gameDonated[itemId];
            delete gameDonatedAt[itemId];
          }

          return {
            donated: {
              ...state.donated,
              [activeTownId]: { ...townDonated, [gameId]: gameDonated },
            },
            donatedAt: {
              ...state.donatedAt,
              [activeTownId]: { ...townDonatedAt, [gameId]: gameDonatedAt },
            },
          };
        }),

      isDonated: itemId => {
        const { activeTownId, donated, towns } = get();
        if (!activeTownId) return false;
        const activeTown = towns.find(t => t.id === activeTownId);
        if (!activeTown) return false;
        return !!donated[activeTownId]?.[activeTown.gameId]?.[itemId];
      },

      getDonatedAt: itemId => {
        const { activeTownId, donatedAt, towns } = get();
        if (!activeTownId) return undefined;
        const activeTown = towns.find(t => t.id === activeTownId);
        if (!activeTown) return undefined;
        return donatedAt[activeTownId]?.[activeTown.gameId]?.[itemId];
      },

      getActiveTown: () => {
        const { towns, activeTownId } = get();
        return towns.find(t => t.id === activeTownId);
      },
    }),
    {
      name: 'ac-web',
      version: 3,
      migrate: migrateStore,
    }
  )
);
