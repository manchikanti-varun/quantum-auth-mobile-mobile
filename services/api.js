/** API client: auth, devices, MFA. Attaches JWT; clears on 401. */

import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

const baseURL = API_BASE_URL?.trim() || undefined;

const api = axios.create({
  baseURL: baseURL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken = null;
let onUnauthorized = null;
let deviceId = null;

export const setAuthToken = (token) => {
  authToken = token;
};

export const setDeviceId = (id) => {
  deviceId = id;
};

export const setOnUnauthorized = (callback) => {
  onUnauthorized = callback;
};

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  if (deviceId) {
    config.headers['X-Device-Id'] = deviceId;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && err?.config?.headers?.Authorization) {
      authToken = null;
      onUnauthorized?.(err);
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  register: (email, password, displayName, securityCode) =>
    api.post('/api/auth/register', { email, password, displayName, securityCode }),

  checkRecoveryOptions: (email) =>
    api.get(`/api/auth/check-recovery-options?email=${encodeURIComponent(email)}`),

  forgotPasswordWithSecurityCode: (email, securityCode, newPassword) =>
    api.post('/api/auth/forgot-password-security-code', { email, securityCode, newPassword }),

  login: (email, password, deviceId) =>
    api.post('/api/auth/login', { email, password, deviceId }),

  getLoginStatus: (challengeId, deviceId) =>
    api.get(`/api/auth/login-status?challengeId=${encodeURIComponent(challengeId)}&deviceId=${encodeURIComponent(deviceId)}`),

  loginWithOtp: (challengeId, deviceId, code) =>
    api.post('/api/auth/login-with-otp', { challengeId, deviceId, code }),

  getLoginHistory: (deviceId) =>
    api.get(`/api/auth/login-history${deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : ''}`),
  deleteLoginHistoryEntry: (id, deviceId) =>
    api.delete(`/api/auth/login-history/${id}`, { data: { deviceId } }),
  getMe: () => api.get('/api/auth/me'),
  updatePreferences: (preferences) =>
    api.patch('/api/auth/preferences', preferences),
  changePassword: (currentPassword, newPassword) =>
    api.post('/api/auth/change-password', { currentPassword, newPassword }),

  forgotPassword: (email, code, newPassword) =>
    api.post('/api/auth/forgot-password', { email, code, newPassword }),

  requestPasswordResetCode: (deviceId) =>
    api.post('/api/auth/request-password-reset-code', deviceId ? { deviceId } : {}),
};

export const deviceApi = {
  list: () => api.get('/api/devices'),
  register: (data) => api.post('/api/devices/register', data),
  revoke: (targetDeviceId) => api.post('/api/devices/revoke', { deviceId: targetDeviceId, currentDeviceId: deviceId }),
};

export const mfaApi = {
  getPending: (deviceId) => api.get(`/api/mfa/pending?deviceId=${encodeURIComponent(deviceId)}`),
  resolve: (data) => api.post('/api/mfa/resolve', data),
  generateCode: (challengeId) => api.post('/api/mfa/generate-code', { challengeId }),
  getHistory: () => api.get('/api/mfa/history'),
};

export default api;
