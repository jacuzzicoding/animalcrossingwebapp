import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Town, Category, DonationRecord, OverallProgress, CategoryProgress } from '@/types';
import { ITEMS_BY_CATEGORY, GRAND_TOTAL, TOTAL_BY_CATEGORY } from '@/data';

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AppState {
  // Towns
  towns: Town[];
  activeTownId: string | null;

  // Donations keyed by townId → itemId → DonationRecord
  donations: Record<string, Record<string, DonationRecord>>;

  // Search history
  searchHistory: string[];

  // ── Town Actions ────────────────────────────────────────────────────────────
  createTown: (town: Omit<Town, 'id' | 'createdAt'>) => Town;
  updateTown: (id: string, updates: Partial<Omit<Town, 'id' | 'createdAt'>>) => void;
  deleteTown: (id: string) => void;
  setActiveTown: (id: string) => void;

  // ── Donation Actions ────────────────────────────────────────────────────────
  donate: (townId: string, itemId: string, category: Category, date?: string) => void;
  undonate: (townId: string, itemId: string) => void;
  isDonated: (townId: string, itemId: string) => boolean;
  getDonationRecord: (townId: string, itemId: string) => DonationRecord | undefined;

  // ── Progress Selectors ──────────────────────────────────────────────────────
  getProgress: (townId: string) => OverallProgress;
  getCategoryProgress: (townId: string, category: Category) => CategoryProgress;

  // ── Search ──────────────────────────────────────────────────────────────────
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;

  // ── Convenience ─────────────────────────────────────────────────────────────
  getActiveTown: () => Town | undefined;
  getActiveDonations: () => Record<string, DonationRecord>;
  getRecentDonations: (townId: string, limit?: number) => DonationRecord[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      towns: [],
      activeTownId: null,
      donations: {},
      searchHistory: [],

      // ── Town Actions ──────────────────────────────────────────────────────

      createTown: (data) => {
        const town: Town = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          towns: [...state.towns, town],
          activeTownId: state.activeTownId ?? town.id,
          donations: { ...state.donations, [town.id]: {} },
        }));
        return town;
      },

      updateTown: (id, updates) => {
        set((state) => ({
          towns: state.towns.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },

      deleteTown: (id) => {
        set((state) => {
          const remaining = state.towns.filter((t) => t.id !== id);
          const { [id]: _removed, ...restDonations } = state.donations;
          const newActive =
            state.activeTownId === id
              ? (remaining[0]?.id ?? null)
              : state.activeTownId;
          return { towns: remaining, donations: restDonations, activeTownId: newActive };
        });
      },

      setActiveTown: (id) => set({ activeTownId: id }),

      // ── Donation Actions ──────────────────────────────────────────────────

      donate: (townId, itemId, category, date) => {
        const record: DonationRecord = {
          itemId,
          category,
          donatedAt: date ?? new Date().toISOString(),
        };
        set((state) => ({
          donations: {
            ...state.donations,
            [townId]: {
              ...(state.donations[townId] ?? {}),
              [itemId]: record,
            },
          },
        }));
      },

      undonate: (townId, itemId) => {
        set((state) => {
          const townDonations = { ...(state.donations[townId] ?? {}) };
          delete townDonations[itemId];
          return { donations: { ...state.donations, [townId]: townDonations } };
        });
      },

      isDonated: (townId, itemId) => {
        return !!get().donations[townId]?.[itemId];
      },

      getDonationRecord: (townId, itemId) => {
        return get().donations[townId]?.[itemId];
      },

      // ── Progress ──────────────────────────────────────────────────────────

      getCategoryProgress: (townId, category) => {
        const donated = Object.values(get().donations[townId] ?? {}).filter(
          (r) => r.category === category
        ).length;
        const total = TOTAL_BY_CATEGORY[category];
        return { category, donated, total, percentage: total > 0 ? donated / total : 0 };
      },

      getProgress: (townId) => {
        const categories: Category[] = ['fish', 'bugs', 'fossils', 'art'];
        const byCategory = categories.map((cat) => get().getCategoryProgress(townId, cat));
        const donated = byCategory.reduce((sum, c) => sum + c.donated, 0);
        return {
          donated,
          total: GRAND_TOTAL,
          percentage: GRAND_TOTAL > 0 ? donated / GRAND_TOTAL : 0,
          byCategory,
        };
      },

      // ── Search ────────────────────────────────────────────────────────────

      addSearchHistory: (query) => {
        const q = query.trim();
        if (!q) return;
        set((state) => ({
          searchHistory: [q, ...state.searchHistory.filter((h) => h !== q)].slice(0, 20),
        }));
      },

      clearSearchHistory: () => set({ searchHistory: [] }),

      // ── Convenience ──────────────────────────────────────────────────────

      getActiveTown: () => {
        const { towns, activeTownId } = get();
        return towns.find((t) => t.id === activeTownId);
      },

      getActiveDonations: () => {
        const { activeTownId, donations } = get();
        return activeTownId ? (donations[activeTownId] ?? {}) : {};
      },

      getRecentDonations: (townId, limit = 10) => {
        const townDonations = Object.values(get().donations[townId] ?? {});
        return townDonations
          .sort((a, b) => new Date(b.donatedAt).getTime() - new Date(a.donatedAt).getTime())
          .slice(0, limit);
      },
    }),
    {
      name: 'ac-companion-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
