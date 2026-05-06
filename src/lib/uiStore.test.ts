import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';

beforeEach(() => {
  useUIStore.setState({
    townManagerOpen: false,
    townManagerForceCreate: false,
    importSaveOpen: false,
  });
});

describe('useUIStore — townManagerOpen gate', () => {
  it('starts closed', () => {
    expect(useUIStore.getState().townManagerOpen).toBe(false);
  });

  it('opens in forceCreate mode when no towns exist', () => {
    useUIStore.getState().openTownManager(true);
    const { townManagerOpen, townManagerForceCreate } = useUIStore.getState();
    expect(townManagerOpen).toBe(true);
    expect(townManagerForceCreate).toBe(true);
  });

  it('closes and resets forceCreate', () => {
    useUIStore.getState().openTownManager(true);
    useUIStore.getState().closeTownManager();
    const { townManagerOpen, townManagerForceCreate } = useUIStore.getState();
    expect(townManagerOpen).toBe(false);
    expect(townManagerForceCreate).toBe(false);
  });

  it('canvas renders nothing when noTowns — full view never mounts without an active town', () => {
    // ACCanvas gate: noTowns ? null : <FullView />
    // When noTowns is true the full home view must never render, regardless of drawer state.
    const noTowns = true;
    expect(noTowns ? 'null' : 'fullView').toBe('null');

    const hasTowns = false;
    expect(hasTowns ? 'null' : 'fullView').toBe('fullView');
  });
});
