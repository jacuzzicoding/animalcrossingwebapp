import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DonationState {
  donated: Record<string, boolean>;
  donatedAt: Record<string, string>; // ISO timestamp per item id
  toggle: (id: string) => void;
  clear: () => void;
}

export const useDonationStore = create<DonationState>()(
  persist(
    set => ({
      donated: {},
      donatedAt: {},
      toggle: (id: string) =>
        set(state => {
          const nowDonated = !state.donated[id];
          const donatedAt = { ...state.donatedAt };
          if (nowDonated) {
            donatedAt[id] = new Date().toISOString();
          } else {
            delete donatedAt[id];
          }
          return {
            donated: { ...state.donated, [id]: nowDonated },
            donatedAt,
          };
        }),
      clear: () => set({ donated: {}, donatedAt: {} }),
    }),
    {
      name: 'ac-web:donated:v0',
    }
  )
);
