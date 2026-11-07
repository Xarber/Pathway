// SPDX-License-Identifier: AGPL-3.0-only
// Platform adapter intentionally avoids shipping native SQLite/WASM in the browser.
export const storage = {
  async get(key: string): Promise<string | null> {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem('pathway:' + key);
  },
  async set(key: string, value: string) {
    localStorage.setItem('pathway:' + key, value);
  },
  async remove(key: string) {
    localStorage.removeItem('pathway:' + key);
  },
};
export const secrets = {
  async get() {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem('pathway:session');
  },
  async set(value: string) {
    sessionStorage.setItem('pathway:session', value);
  },
  async clear() {
    sessionStorage.removeItem('pathway:session');
  },
};
