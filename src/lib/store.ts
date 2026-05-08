import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameId } from './types';
import { migrateStore } from './storeMigrations';
import type { ImportPlan } from './saveFileReconcile';

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

export interface MuseumDisplaySettings {
  /** Render un-donated items as black silhouettes; default true (AC-canonical). */
  silhouettesEnabled: boolean;
}

interface AppState {
  towns: Town[];
  activeTownId: string | null;
  // donated[townId][gameId][itemId] = true
  donated: Record<string, Record<string, Record<string, boolean>>>;
  // donatedAt[townId][gameId][itemId] = ISO string
  donatedAt: Record<string, Record<string, Record<string, string>>>;
  museumDisplay: MuseumDisplaySettings;
  setSilhouettesEnabled: (enabled: boolean) => void;

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
  /** Apply a parsed save-file ImportPlan atomically. Returns the affected townId. */
  applyImportedSave: (plan: ImportPlan) => string;
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
      museumDisplay: { silhouettesEnabled: true },

      setSilhouettesEnabled: enabled =>
        set(state => ({
          museumDisplay: {
            ...state.museumDisplay,
            silhouettesEnabled: enabled,
          },
        })),

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

      applyImportedSave: plan => {
        let resultTownId = '';
        set(state => {
          if (plan.kind === 'create') {
            const id = generateId();
            const newTown: Town = {
              id,
              name: plan.newTown.name,
              gameId: plan.newTown.gameId,
              hemisphere: plan.newTown.hemisphere,
              createdAt: plan.newTown.createdAt,
            };
            const itemMap: Record<string, boolean> = {};
            const atMap: Record<string, string> = {};
            for (const r of plan.donations) {
              itemMap[r.itemId] = true;
              if (r.donatedAt) atMap[r.itemId] = r.donatedAt;
            }
            resultTownId = id;
            return {
              towns: [...state.towns, newTown],
              activeTownId: id,
              donated: {
                ...state.donated,
                [id]: { [newTown.gameId]: itemMap },
              },
              donatedAt: {
                ...state.donatedAt,
                [id]: { [newTown.gameId]: atMap },
              },
            };
          }

          if (plan.kind === 'replace') {
            const towns = state.towns.map(t => {
              if (t.id !== plan.townId) return t;
              const next: Town = { ...t };
              if (plan.townPatch.name !== undefined)
                next.name = plan.townPatch.name;
              if (
                plan.townPatch.hemisphere !== undefined &&
                plan.townPatch.hemisphere !== null
              ) {
                next.hemisphere = plan.townPatch.hemisphere;
              }
              return next;
            });
            const itemMap: Record<string, boolean> = {};
            const atMap: Record<string, string> = {};
            for (const r of plan.donations) {
              itemMap[r.itemId] = true;
              if (r.donatedAt) atMap[r.itemId] = r.donatedAt;
            }
            const donated = {
              ...state.donated,
              [plan.townId]: {
                ...(state.donated[plan.townId] ?? {}),
                [plan.gameId]: itemMap,
              },
            };
            const donatedAt = {
              ...state.donatedAt,
              [plan.townId]: {
                ...(state.donatedAt[plan.townId] ?? {}),
                [plan.gameId]: atMap,
              },
            };
            resultTownId = plan.townId;
            return { towns, donated, donatedAt, activeTownId: plan.townId };
          }

          // merge
          const itemMap: Record<string, boolean> = {};
          const atMap: Record<string, string> = {};
          for (const r of plan.donations) {
            itemMap[r.itemId] = true;
            if (r.donatedAt) atMap[r.itemId] = r.donatedAt;
          }
          const donated = {
            ...state.donated,
            [plan.townId]: {
              ...(state.donated[plan.townId] ?? {}),
              [plan.gameId]: itemMap,
            },
          };
          const donatedAt = {
            ...state.donatedAt,
            [plan.townId]: {
              ...(state.donatedAt[plan.townId] ?? {}),
              [plan.gameId]: atMap,
            },
          };
          resultTownId = plan.townId;
          return { donated, donatedAt, activeTownId: plan.townId };
        });
        return resultTownId;
      },

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
