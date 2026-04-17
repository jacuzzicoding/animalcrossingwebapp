/* eslint-env jest */
// Global test setup for jsdom environment.
// localStorage is provided by jsdom — clear it between tests so
// the Zustand persist middleware starts fresh each time.
beforeEach(() => {
  localStorage.clear();
});
