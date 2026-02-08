/**
 * Application configuration constants.
 * API base URL, SecureStore keys, default folders, auto-lock options.
 * Set EXPO_PUBLIC_API_URL in .env or eas.json to override production API.
 * @module constants/config
 */

const PRODUCTION_API_URL = 'https://quantum-auth-mobile-backend-production-c4a5.up.railway.app';
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL).trim();
export const ACCOUNTS_KEY = 'QSAFE_TOTP_ACCOUNTS';
export const ACCOUNTS_KEY_PREFIX = 'QSAFE_ACCOUNTS_';
export const CUSTOM_FOLDERS_KEY_PREFIX = 'QSAFE_FOLDERS_';
export const DEVICE_KEY = 'QSAFE_DEVICE_ID';
export const PQC_KEYPAIR_KEY = 'QSAFE_PQC_KEYPAIR';
export const AUTH_TOKEN_KEY = 'QSAFE_AUTH_TOKEN';
export const THEME_PREFERENCE_KEY = 'QSAFE_THEME_PREFERENCE';
export const PREFERENCES_KEY = 'QSAFE_PREFERENCES';
export const APP_LOCK_KEY = 'QSAFE_APP_LOCK';
export const CUSTOM_FOLDERS_KEY = 'QSAFE_CUSTOM_FOLDERS';
export const AUTO_LOCK_KEY = 'QSAFE_AUTO_LOCK_MINUTES';
export const INTRO_SEEN_KEY = 'QSAFE_INTRO_SEEN';
export const DEFAULT_FOLDERS = ['Personal', 'Work', 'Banking'];
export const AUTO_LOCK_OPTIONS = [
  { value: 0, label: 'Never', icon: 'clock-outline' },
  { value: 1, label: '1 minute', icon: 'timer-sand' },
  { value: 5, label: '5 minutes', icon: 'timer-sand-empty' },
  { value: 15, label: '15 minutes', icon: 'timer-outline' },
  { value: 30, label: '30 minutes', icon: 'clock-alert-outline' },
];
