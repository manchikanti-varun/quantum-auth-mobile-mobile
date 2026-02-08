/**
 * Secure storage layer using expo-secure-store (Keychain/Keystore).
 * Persists auth token, TOTP accounts, PQC keypair, preferences, app lock settings.
 * Large keypair data is chunked when exceeding SecureStore size limits.
 * @module services/storage
 */
import * as SecureStore from 'expo-secure-store';
import { ACCOUNTS_KEY, ACCOUNTS_KEY_PREFIX, CUSTOM_FOLDERS_KEY, CUSTOM_FOLDERS_KEY_PREFIX, DEVICE_KEY, PQC_KEYPAIR_KEY, AUTH_TOKEN_KEY, PREFERENCES_KEY, APP_LOCK_KEY, AUTO_LOCK_KEY, INTRO_SEEN_KEY, SESSION_TIMEOUT_KEY, LAST_ACTIVITY_KEY } from '../constants/config';

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
  _accountsKey(uid) {
    return uid ? `${ACCOUNTS_KEY_PREFIX}${uid}` : ACCOUNTS_KEY;
  },

  async getAccounts(uid) {
    const key = this._accountsKey(uid);
    try {
      const raw = await SecureStore.getItemAsync(key);
      if (raw) return JSON.parse(raw);
      if (uid) {
        const legacy = await SecureStore.getItemAsync(ACCOUNTS_KEY);
        if (legacy) {
          const parsed = JSON.parse(legacy);
          await SecureStore.setItemAsync(key, legacy);
          await SecureStore.deleteItemAsync(ACCOUNTS_KEY);
          return parsed;
        }
        return [];
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  async saveAccounts(accounts, uid) {
    const key = this._accountsKey(uid);
    try {
      const data = JSON.stringify(accounts);
      await SecureStore.setItemAsync(key, data);
      return true;
    } catch (e) {
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
      let raw = await SecureStore.getItemAsync(PQC_KEYPAIR_KEY);
      if (!raw) {
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
    const CHUNK_SIZE = 2000;
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

  _foldersKey(uid) {
    return uid ? `${CUSTOM_FOLDERS_KEY_PREFIX}${uid}` : CUSTOM_FOLDERS_KEY;
  },

  async getCustomFolders(uid) {
    const key = this._foldersKey(uid);
    try {
      const raw = await SecureStore.getItemAsync(key);
      if (raw) return JSON.parse(raw);
      if (uid) {
        const legacy = await SecureStore.getItemAsync(CUSTOM_FOLDERS_KEY);
        if (legacy) {
          await SecureStore.setItemAsync(key, legacy);
          await SecureStore.deleteItemAsync(CUSTOM_FOLDERS_KEY);
          return JSON.parse(legacy);
        }
        return null;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  async saveCustomFolders(folders, uid) {
    const key = this._foldersKey(uid);
    if (folders && Array.isArray(folders)) {
      await SecureStore.setItemAsync(key, JSON.stringify(folders));
    } else {
      await SecureStore.deleteItemAsync(key);
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

  async getIntroSeen() {
    try {
      const v = await SecureStore.getItemAsync(INTRO_SEEN_KEY);
      return v === 'true';
    } catch (e) {
      return false;
    }
  },

  async setIntroSeen() {
    await SecureStore.setItemAsync(INTRO_SEEN_KEY, 'true');
  },

  async getSessionTimeoutDays() {
    try {
      const raw = await SecureStore.getItemAsync(SESSION_TIMEOUT_KEY);
      return raw != null ? parseInt(raw, 10) : 90;
    } catch (e) {
      return 90;
    }
  },

  async saveSessionTimeoutDays(days) {
    await SecureStore.setItemAsync(SESSION_TIMEOUT_KEY, String(days));
  },

  async getLastActivity() {
    try {
      const raw = await SecureStore.getItemAsync(LAST_ACTIVITY_KEY);
      return raw != null ? parseInt(raw, 10) : 0;
    } catch (e) {
      return 0;
    }
  },

  async saveLastActivity(timestamp) {
    await SecureStore.setItemAsync(LAST_ACTIVITY_KEY, String(timestamp));
  },
};
