/**
 * Called from main.tsx before createRoot.
 * Copies old 'ac-web:v1' localStorage key to 'ac-web' so Zustand's
 * built-in migrate() function can perform a lossless schema upgrade.
 * Safe to call on every startup — no-ops if already migrated.
 */
export function bootstrapLocalStorageMigration(): void {
  const OLD_KEY = 'ac-web:v1';
  const NEW_KEY = 'ac-web';
  const old = localStorage.getItem(OLD_KEY);
  if (old && !localStorage.getItem(NEW_KEY)) {
    localStorage.setItem(NEW_KEY, old);
  }
  // Remove the old key only once the new key is present AND parseable. A
  // corrupted 'ac-web' value must not trigger deletion of 'ac-web:v1' — that
  // would destroy the only remaining valid copy of the user's pre-rename data.
  const current = localStorage.getItem(NEW_KEY);
  if (current !== null && isParseable(current)) {
    localStorage.removeItem(OLD_KEY);
  }
}

function isParseable(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}
