/**
 * API client – auth, devices, MFA. Auto-attaches JWT, clears on 401.
 */
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

const api = axios.create({
  baseURL: API_BASE_URL,
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

  googleAuth: (idToken) =>
    api.post('/api/auth/google', { idToken }),

  getLoginStatus: (challengeId, deviceId) =>
    api.get(`/api/auth/login-status?challengeId=${encodeURIComponent(challengeId)}&deviceId=${encodeURIComponent(deviceId)}`),

  loginWithOtp: (challengeId, deviceId, code) =>
    api.post('/api/auth/login-with-otp', { challengeId, deviceId, code }),

  getLoginHistory: () => api.get('/api/auth/login-history'),
  getMe: () => api.get('/api/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    api.post('/api/auth/change-password', { currentPassword, newPassword }),
};

export const deviceApi = {
  register: (data) => api.post('/api/devices/register', data),
};

export const mfaApi = {
  getPending: (deviceId) => api.get(`/api/mfa/pending?deviceId=${deviceId}`),
  resolve: (data) => api.post('/api/mfa/resolve', data),
  generateCode: (challengeId) => api.post('/api/mfa/generate-code', { challengeId }),
  getHistory: () => api.get('/api/mfa/history'),
};

export default api;
