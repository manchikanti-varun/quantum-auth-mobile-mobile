/**
 * Secure storage – token, accounts, PQC keys, preferences, app lock.
 * Uses expo-secure-store (Keychain / Keystore). PQC keypair chunked when > 2KB.
 */
import * as SecureStore from 'expo-secure-store';
import { ACCOUNTS_KEY, DEVICE_KEY, PQC_KEYPAIR_KEY, AUTH_TOKEN_KEY, PREFERENCES_KEY, APP_LOCK_KEY, CUSTOM_FOLDERS_KEY, AUTO_LOCK_KEY } from '../constants/config';

export const storage = {
  async getToken() {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  },

  async saveToken(token) {
    if (token) {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    }
  },
  async getAccounts() {
    try {
      const raw = await SecureStore.getItemAsync(ACCOUNTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.log('Failed to load accounts', e);
      return [];
    }
  },

  async saveAccounts(accounts) {
    try {
      const data = JSON.stringify(accounts);
      await SecureStore.setItemAsync(ACCOUNTS_KEY, data);
      return true;
    } catch (e) {
      console.log('Failed to save accounts', e);
      throw e;
    }
  },

  async getDeviceId() {
    return await SecureStore.getItemAsync(DEVICE_KEY);
  },

  async saveDeviceId(deviceId) {
    await SecureStore.setItemAsync(DEVICE_KEY, deviceId);
  },

  async getPqcKeypair() {
    try {
      // Try single key first (backward compat)
      let raw = await SecureStore.getItemAsync(PQC_KEYPAIR_KEY);
      if (!raw) {
        // Chunked format (over 2048 bytes)
        const chunks = [];
        for (let i = 0; ; i++) {
          const part = await SecureStore.getItemAsync(`${PQC_KEYPAIR_KEY}_${i}`);
          if (!part) break;
          chunks.push(part);
        }
        raw = chunks.length ? chunks.join('') : null;
      }
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  async savePqcKeypair(keypair) {
    const data = JSON.stringify(keypair);
    const CHUNK_SIZE = 2000; // SecureStore limit 2048
    if (data.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(PQC_KEYPAIR_KEY, data);
      for (let i = 0; ; i++) {
        const key = `${PQC_KEYPAIR_KEY}_${i}`;
        const v = await SecureStore.getItemAsync(key);
        if (v == null) break;
        await SecureStore.deleteItemAsync(key);
      }
      return;
    }
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      await SecureStore.setItemAsync(
        `${PQC_KEYPAIR_KEY}_${i / CHUNK_SIZE}`,
        data.slice(i, i + CHUNK_SIZE),
      );
    }
    await SecureStore.deleteItemAsync(PQC_KEYPAIR_KEY);
    const numChunks = Math.ceil(data.length / CHUNK_SIZE);
    for (let i = numChunks; ; i++) {
      const key = `${PQC_KEYPAIR_KEY}_${i}`;
      if ((await SecureStore.getItemAsync(key)) == null) break;
      await SecureStore.deleteItemAsync(key);
    }
  },

  async getPreferences() {
    try {
      const raw = await SecureStore.getItemAsync(PREFERENCES_KEY);
      return raw ? JSON.parse(raw) : { sortBy: 'issuer', showFavoritesFirst: true };
    } catch (e) {
      return { sortBy: 'issuer', showFavoritesFirst: true };
    }
  },

  async savePreferences(prefs) {
    await SecureStore.setItemAsync(PREFERENCES_KEY, JSON.stringify(prefs));
  },

  async getAppLock() {
    try {
      const raw = await SecureStore.getItemAsync(APP_LOCK_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  async saveAppLock(config) {
    if (config) {
      await SecureStore.setItemAsync(APP_LOCK_KEY, JSON.stringify(config));
    } else {
      await SecureStore.deleteItemAsync(APP_LOCK_KEY);
    }
  },

  async getCustomFolders() {
    try {
      const raw = await SecureStore.getItemAsync(CUSTOM_FOLDERS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  async saveCustomFolders(folders) {
    if (folders && Array.isArray(folders)) {
      await SecureStore.setItemAsync(CUSTOM_FOLDERS_KEY, JSON.stringify(folders));
    } else {
      await SecureStore.deleteItemAsync(CUSTOM_FOLDERS_KEY);
    }
  },

  async getAutoLockMinutes() {
    try {
      const raw = await SecureStore.getItemAsync(AUTO_LOCK_KEY);
      return raw != null ? parseInt(raw, 10) : 0;
    } catch (e) {
      return 0;
    }
  },

  async saveAutoLockMinutes(minutes) {
    await SecureStore.setItemAsync(AUTO_LOCK_KEY, String(minutes));
  },
};
