import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TownManager } from './TownManager';
import { useUIStore } from '../lib/uiStore';
import { useAppStore } from '../lib/store';

vi.mock('../lib/store', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('../lib/uiStore', () => ({
  useUIStore: vi.fn(),
}));

function makeUIStore(overrides = {}) {
  return {
    townManagerOpen: true,
    townManagerForceCreate: true,
    closeTownManager: vi.fn(),
    openImportSave: vi.fn(),
    importSaveOpen: false,
    closeImportSave: vi.fn(),
    ...overrides,
  };
}

function makeAppStore(towns: unknown[] = []) {
  return {
    towns,
    activeTownId: null,
    donated: {},
    setActiveTown: vi.fn(),
    updateTown: vi.fn(),
    createTown: vi.fn(),
    deleteTown: vi.fn(),
  };
}

function renderTownManager() {
  return render(
    <MemoryRouter>
      <TownManager />
    </MemoryRouter>
  );
}

describe('TownManager — onboarding import link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders import link when forceCreate=true and towns=[]', () => {
    (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (sel: (s: ReturnType<typeof makeUIStore>) => unknown) =>
        sel(makeUIStore())
    );
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (sel: (s: ReturnType<typeof makeAppStore>) => unknown) =>
        sel(makeAppStore([]))
    );

    renderTownManager();
    expect(
      screen.getByRole('button', { name: /or import an existing save/i })
    ).toBeTruthy();
  });

  it('does NOT render import link when towns already exist', () => {
    const existingTown = {
      id: 't1',
      name: 'Marigold',
      gameId: 'ACNH',
      hemisphere: 'NH',
      createdAt: new Date().toISOString(),
    };
    (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (sel: (s: ReturnType<typeof makeUIStore>) => unknown) =>
        sel(makeUIStore({ townManagerForceCreate: false }))
    );
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (sel: (s: ReturnType<typeof makeAppStore>) => unknown) =>
        sel(makeAppStore([existingTown]))
    );

    renderTownManager();
    expect(
      screen.queryByRole('button', { name: /or import an existing save/i })
    ).toBeNull();
  });

  it('clicking import link calls close() and openImportSave()', () => {
    const uiState = makeUIStore();
    (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (sel: (s: ReturnType<typeof makeUIStore>) => unknown) => sel(uiState)
    );
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (sel: (s: ReturnType<typeof makeAppStore>) => unknown) =>
        sel(makeAppStore([]))
    );

    renderTownManager();
    fireEvent.click(
      screen.getByRole('button', { name: /or import an existing save/i })
    );
    expect(uiState.closeTownManager).toHaveBeenCalled();
    expect(uiState.openImportSave).toHaveBeenCalled();
  });

  it('empty-state import button still renders when forceCreate=false and towns=[]', () => {
    (useUIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (sel: (s: ReturnType<typeof makeUIStore>) => unknown) =>
        sel(makeUIStore({ townManagerForceCreate: false }))
    );
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (sel: (s: ReturnType<typeof makeAppStore>) => unknown) =>
        sel(makeAppStore([]))
    );

    renderTownManager();
    expect(
      screen.queryByRole('button', { name: /import save instead/i })
    ).not.toBeNull();
  });
});
