import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DonationState {
  donated: Record<string, boolean>;
  toggle: (id: string) => void;
  clear: () => void;
}

export const useDonationStore = create<DonationState>()(
  persist(
    set => ({
      donated: {},
      toggle: (id: string) =>
        set(state => ({
          donated: {
            ...state.donated,
            [id]: !state.donated[id],
          },
        })),
      clear: () => set({ donated: {} }),
    }),
    {
      name: 'ac-web:donated:v0',
    }
  )
);
