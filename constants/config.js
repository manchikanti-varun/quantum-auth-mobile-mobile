/**
 * App configuration – API URL, storage keys, default folders, auto-lock options.
 * Google Sign-In: set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and EXPO_PUBLIC_FIREBASE_* from Firebase Console.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://quantum-auth-mobile-backend-production.up.railway.app';
export const ACCOUNTS_KEY = 'QSAFE_TOTP_ACCOUNTS';
export const DEVICE_KEY = 'QSAFE_DEVICE_ID';
export const PQC_KEYPAIR_KEY = 'QSAFE_PQC_KEYPAIR';
export const AUTH_TOKEN_KEY = 'QSAFE_AUTH_TOKEN';
export const THEME_PREFERENCE_KEY = 'QSAFE_THEME_PREFERENCE';
export const PREFERENCES_KEY = 'QSAFE_PREFERENCES';
export const APP_LOCK_KEY = 'QSAFE_APP_LOCK';
export const CUSTOM_FOLDERS_KEY = 'QSAFE_CUSTOM_FOLDERS';
export const AUTO_LOCK_KEY = 'QSAFE_AUTO_LOCK_MINUTES';
export const DEFAULT_FOLDERS = ['Personal', 'Work', 'Banking'];
export const AUTO_LOCK_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 1, label: '1 minute' },
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
];
