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
      const raw = await SecureStore.getItemAsync(PQC_KEYPAIR_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  async savePqcKeypair(keypair) {
    await SecureStore.setItemAsync(PQC_KEYPAIR_KEY, JSON.stringify(keypair));
  },
};
