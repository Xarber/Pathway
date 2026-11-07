// SPDX-License-Identifier: AGPL-3.0-only
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
let database: Promise<SQLite.SQLiteDatabase> | undefined;
async function db() {
  if (!database)
    database = SQLite.openDatabaseAsync('pathway.db').then(async (d) => {
      await d.execAsync(
        'PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);',
      );
      return d;
    });
  return database;
}
export const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web')
      return typeof localStorage === 'undefined' ? null : localStorage.getItem('pathway:' + key);
    return (
      (
        await (
          await db()
        ).getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key=?', key)
      )?.value || null
    );
  },
  async set(key: string, value: string) {
    if (Platform.OS === 'web') {
      localStorage.setItem('pathway:' + key, value);
      return;
    }
    await (
      await db()
    ).runAsync(
      'INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      key,
      value,
    );
  },
  async remove(key: string) {
    if (Platform.OS === 'web') localStorage.removeItem('pathway:' + key);
    else await (await db()).runAsync('DELETE FROM settings WHERE key=?', key);
  },
};
export const secrets = {
  async get() {
    return Platform.OS === 'web'
      ? typeof sessionStorage === 'undefined'
        ? null
        : sessionStorage.getItem('pathway:session')
      : SecureStore.getItemAsync('session');
  },
  async set(value: string) {
    if (Platform.OS === 'web') sessionStorage.setItem('pathway:session', value);
    else
      await SecureStore.setItemAsync('session', value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
  },
  async clear() {
    if (Platform.OS === 'web') sessionStorage.removeItem('pathway:session');
    else await SecureStore.deleteItemAsync('session');
  },
};
