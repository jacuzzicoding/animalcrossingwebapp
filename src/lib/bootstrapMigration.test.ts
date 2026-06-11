import { describe, it, expect } from 'vitest';
import { bootstrapLocalStorageMigration } from './bootstrapMigration';

const OLD_KEY = 'ac-web:v1';
const NEW_KEY = 'ac-web';
// localStorage is cleared between tests by src/test/setup.ts.

describe('bootstrapLocalStorageMigration', () => {
  it('copies the old key to the new key and removes the old key', () => {
    const payload = JSON.stringify({ state: { towns: [] }, version: 1 });
    localStorage.setItem(OLD_KEY, payload);

    bootstrapLocalStorageMigration();

    expect(localStorage.getItem(NEW_KEY)).toBe(payload);
    expect(localStorage.getItem(OLD_KEY)).toBeNull();
  });

  it('does not overwrite an existing new key', () => {
    const oldPayload = JSON.stringify({
      state: { towns: ['old'] },
      version: 1,
    });
    const newPayload = JSON.stringify({
      state: { towns: ['new'] },
      version: 3,
    });
    localStorage.setItem(OLD_KEY, oldPayload);
    localStorage.setItem(NEW_KEY, newPayload);

    bootstrapLocalStorageMigration();

    expect(localStorage.getItem(NEW_KEY)).toBe(newPayload);
    expect(localStorage.getItem(OLD_KEY)).toBeNull();
  });

  it('is a no-op when neither key exists', () => {
    expect(() => bootstrapLocalStorageMigration()).not.toThrow();
    expect(localStorage.getItem(NEW_KEY)).toBeNull();
    expect(localStorage.getItem(OLD_KEY)).toBeNull();
  });

  it('does not destroy the old key when the new key is corrupt (DI-6)', () => {
    const oldPayload = JSON.stringify({
      state: { towns: ['real'] },
      version: 1,
    });
    localStorage.setItem(OLD_KEY, oldPayload);
    localStorage.setItem(NEW_KEY, '{ this is not valid json');

    bootstrapLocalStorageMigration();

    // The only valid copy of the user's data must survive.
    expect(localStorage.getItem(OLD_KEY)).toBe(oldPayload);
  });

  it('removes the old key once a valid new key is present', () => {
    localStorage.setItem(OLD_KEY, JSON.stringify({ state: {}, version: 1 }));
    localStorage.setItem(NEW_KEY, JSON.stringify({ state: {}, version: 3 }));

    bootstrapLocalStorageMigration();

    expect(localStorage.getItem(OLD_KEY)).toBeNull();
  });
});
