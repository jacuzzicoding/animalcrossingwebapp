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

  it('canvas empty-state gate: suppressed when townManagerOpen is true', () => {
    // Simulates the ACCanvas condition: noTowns && !townManagerOpen
    const noTowns = true;

    useUIStore.getState().openTownManager(true);
    const { townManagerOpen } = useUIStore.getState();
    expect(noTowns && !townManagerOpen).toBe(false); // empty-state suppressed

    useUIStore.getState().closeTownManager();
    const { townManagerOpen: closedOpen } = useUIStore.getState();
    expect(noTowns && !closedOpen).toBe(true); // empty-state visible when drawer closed
  });
});
