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
  // Remove old key once new key is confirmed present
  if (localStorage.getItem(NEW_KEY)) {
    localStorage.removeItem(OLD_KEY);
  }
}
