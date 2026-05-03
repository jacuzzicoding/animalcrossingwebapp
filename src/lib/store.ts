import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameId } from './types';
import { migrateStore } from './storeMigrations';

export type Hemisphere = 'NH' | 'SH';

export interface Town {
  id: string;
  name: string;
  gameId: GameId;
  hemisphere: Hemisphere;
  createdAt: string;
}

export interface TownPatch {
  name?: string;
  hemisphere?: Hemisphere | null;
}

interface AppState {
  towns: Town[];
  activeTownId: string | null;
  // donated[townId][gameId][itemId] = true
  donated: Record<string, Record<string, Record<string, boolean>>>;
  // donatedAt[townId][gameId][itemId] = ISO string
  donatedAt: Record<string, Record<string, Record<string, string>>>;

  createTown: (name: string, gameId: GameId, hemisphere?: Hemisphere) => Town;
  updateTown: (id: string, patch: TownPatch) => void;
  setTownHemisphere: (id: string, hemisphere: Hemisphere) => void;
  setActiveTown: (id: string) => void;
  deleteTown: (id: string) => void;
  toggle: (itemId: string) => void;
  isDonated: (itemId: string) => boolean;
  getDonatedAt: (itemId: string) => string | undefined;
  getActiveTown: () => Town | undefined;
  resetActiveTownDonations: () => void;
  resetAll: () => void;
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

      createTown: (name, gameId, hemisphere = 'NH') => {
        const town: Town = {
          id: generateId(),
          name,
          gameId,
          hemisphere,
          createdAt: new Date().toISOString(),
        };
        set(state => ({
          towns: [...state.towns, town],
          activeTownId: town.id,
        }));
        return town;
      },

      updateTown: (id, patch) =>
        set(state => ({
          towns: state.towns.map(t => {
            if (t.id !== id) return t;
            const next: Town = { ...t };
            if (patch.name !== undefined) next.name = patch.name;
            if (patch.hemisphere !== undefined && patch.hemisphere !== null) {
              next.hemisphere = patch.hemisphere;
            }
            return next;
          }),
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

      resetActiveTownDonations: () =>
        set(state => {
          const { activeTownId } = state;
          if (!activeTownId) return state;
          const donated = { ...state.donated };
          const donatedAt = { ...state.donatedAt };
          delete donated[activeTownId];
          delete donatedAt[activeTownId];
          return { donated, donatedAt };
        }),

      resetAll: () => {
        try {
          localStorage.removeItem('ac-curator-search-history');
        } catch {
          // ignore — localStorage may be unavailable (SSR / privacy mode)
        }
        set({
          towns: [],
          activeTownId: null,
          donated: {},
          donatedAt: {},
        });
      },
    }),
    {
      name: 'ac-web',
      version: 3,
      migrate: migrateStore,
    }
  )
);
