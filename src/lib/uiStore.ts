import { create } from 'zustand';

interface UIState {
  townManagerOpen: boolean;
  /** When true, drawer is locked open (no scrim/Esc dismiss) and forced into create mode. Used when no towns exist. */
  townManagerForceCreate: boolean;
  openTownManager: (forceCreate?: boolean) => void;
  closeTownManager: () => void;
  importSaveOpen: boolean;
  openImportSave: () => void;
  closeImportSave: () => void;
}

export const useUIStore = create<UIState>(set => ({
  townManagerOpen: false,
  townManagerForceCreate: false,
  openTownManager: (forceCreate = false) =>
    set({ townManagerOpen: true, townManagerForceCreate: forceCreate }),
  closeTownManager: () =>
    set({ townManagerOpen: false, townManagerForceCreate: false }),
  importSaveOpen: false,
  openImportSave: () => set({ importSaveOpen: true }),
  closeImportSave: () => set({ importSaveOpen: false }),
}));
