import * as SecureStore from 'expo-secure-store';
import { ACCOUNTS_KEY, DEVICE_KEY, PQC_KEYPAIR_KEY, AUTH_TOKEN_KEY } from '../constants/config';

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
};
