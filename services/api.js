/**
 * API client – auth, devices, MFA. Auto-attaches JWT, clears on 401.
 * Set EXPO_PUBLIC_API_URL in .env for production.
 */
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

const baseURL = API_BASE_URL?.trim() || undefined;
if (!baseURL && __DEV__) {
  console.warn('EXPO_PUBLIC_API_URL is not set. Add it to .env for API calls.');
}

const api = axios.create({
  baseURL: baseURL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken = null;
let onUnauthorized = null;

export const setAuthToken = (token) => {
  authToken = token;
};

export const setOnUnauthorized = (callback) => {
  onUnauthorized = callback;
};

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && err?.config?.headers?.Authorization) {
      authToken = null;
      onUnauthorized?.();
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  register: (email, password, displayName) =>
    api.post('/api/auth/register', { email, password, displayName }),

  login: (email, password, deviceId) =>
    api.post('/api/auth/login', { email, password, deviceId }),

  getLoginStatus: (challengeId, deviceId) =>
    api.get(`/api/auth/login-status?challengeId=${encodeURIComponent(challengeId)}&deviceId=${encodeURIComponent(deviceId)}`),

  loginWithOtp: (challengeId, deviceId, code) =>
    api.post('/api/auth/login-with-otp', { challengeId, deviceId, code }),

  getLoginHistory: () => api.get('/api/auth/login-history'),
  deleteLoginHistoryEntry: (id, deviceId) =>
    api.delete(`/api/auth/login-history/${id}`, { data: { deviceId } }),
  getMe: () => api.get('/api/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    api.post('/api/auth/change-password', { currentPassword, newPassword }),
};

export const deviceApi = {
  register: (data) => api.post('/api/devices/register', data),
  revoke: (deviceId) => api.post('/api/devices/revoke', { deviceId }),
};

export const mfaApi = {
  getPending: (deviceId) => api.get(`/api/mfa/pending?deviceId=${encodeURIComponent(deviceId)}`),
  resolve: (data) => api.post('/api/mfa/resolve', data),
  generateCode: (challengeId) => api.post('/api/mfa/generate-code', { challengeId }),
  getHistory: () => api.get('/api/mfa/history'),
};

export default api;
