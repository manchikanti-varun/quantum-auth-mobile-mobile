# QSafe Mobile – Codebase Documentation

Production-ready documentation for the QSafe 2FA authenticator mobile application.

---

## Entry Point

### `index.js`
Application entry point. Imports polyfills for `react-native-get-random-values` (required by uuid) and `Buffer` (required by @asanrom/dilithium). Registers the root App component with Expo.

### `App.js`
Main application component. Orchestrates authentication state, app lock, biometric gate, and modal routing. Wraps content in ThemeProvider, ToastProvider, and SafeAreaProvider. Handles:
- Device identity initialization
- App lock configuration and auto-lock
- Biometric unlock on app resume
- QR scan, MFA approve/deny, settings, export/import, history modals
- otpauth:// deep linking

---

## Constants

### `constants/config.js`
Application configuration. Exports `API_BASE_URL` (from `EXPO_PUBLIC_API_URL` or production default), SecureStore keys for accounts, device, PQC keypair, auth token, preferences, app lock, auto-lock, intro. Defines `DEFAULT_FOLDERS` and `AUTO_LOCK_OPTIONS`.

### `constants/designTokens.js`
Design tokens for consistent spacing, radii, typography, and touch target size across the app.

### `constants/themes.js`
Light and dark theme definitions. Colors, gradients, typography, shadows. Exports `themeDark` and `themeLight`.

### `constants/securityQuestions.js`
Security question options for account recovery. Must match backend constants.

---

## Context

### `context/ThemeContext.js`
Theme provider. Manages light/dark/system preference, persisted to SecureStore. Exports `ThemeProvider`, `useTheme()`.

### `context/ToastContext.js`
Toast notification provider. Displays brief feedback messages app-wide. Exports `ToastProvider`, `useToast()`.

---

## Hooks

### `hooks/useAuth.js`
Authentication hook. Login, register, logout. Manages JWT token and user state. Polls for MFA approval when login requires second device. Integrates with device registration and push notifications. Exports `login`, `register`, `logout`, `pendingMfa`, `cancelPendingMfa`, `loginWithOtp`, `refreshUser`.

### `hooks/useAccounts.js`
TOTP accounts hook. Loads and persists accounts from SecureStore. Generates TOTP codes every second. Manages favorites, folders, sort order, last-used timestamps. Exports `addAccount`, `removeAccount`, `toggleFavorite`, `updateAccount`, `setLastUsed`, `reloadAccounts`.

### `hooks/useFolders.js`
Folders hook. Manages default and custom folders. Add, rename, remove. Exports `folders`, `addFolder`, `renameFolder`, `removeFolder`, `refreshFolders`.

### `hooks/useLayout.js`
Responsive layout hook. Provides horizontal padding, content max width, safe area insets. Adapts to phone, phablet, tablet breakpoints.

### `hooks/useMfa.js`
MFA hook. Polls for pending login challenges. Resolves with PQC signature (approve/deny). Bursts polling when app becomes active. Exports `pendingChallenge`, `resolveChallenge`, `checkForPendingChallenges`.

---

## Services

### `services/api.js`
HTTP API client. Axios instance with JWT attachment and 401 handling. Exports `authApi`, `deviceApi`, `mfaApi`, `setAuthToken`, `setOnUnauthorized`.

### `services/device.js`
Device identity and PQC (Dilithium2) keypair management. Ensures unique device ID, generates or migrates keypair, signs messages for MFA approval.

### `services/storage.js`
Secure storage layer using expo-secure-store. Persists auth token, TOTP accounts, PQC keypair, preferences, app lock settings. Large keypair data is chunked when exceeding SecureStore limits.

### `services/biometric.js`
Biometric authentication (fingerprint, face ID). Uses expo-local-authentication with device passcode fallback.

### `services/totp.js`
TOTP (RFC 6238) implementation. Self-contained HMAC-SHA1 and base32 decode. Exports `generateTOTP`, `generateTOTPWithAdjacent`, `getTimeRemainingInWindow`.

### `services/qrParser.js`
Parses otpauth:// URIs from QR codes or pasted strings. Extracts secret, issuer, and account label.

### `services/pushNotifications.js`
Expo Push Notifications. Retrieves push token for MFA login alerts. Returns null on simulator, in Expo Go, or when permission is denied.

### `services/googleAuth.js`
Google Sign-In integration placeholder for future implementation.

---

## Utils

### `utils/validation.js`
Form validation for email, password, display name, security code. Matches backend validation rules. Exports `validateRegister`, `validateLogin`, `validatePassword`, `validateSecurityCode`, `PASSWORD_REQUIREMENTS`, `SECURITY_CODE_HINT`.

### `utils/pinHash.js`
PIN hashing for app lock. SHA256 with salt. Exports `hashPin`, `verifyPin`.

### `utils/issuerIcons.js`
Issuer-to-icon mapping and brand colors for account cards. Exports `getIssuerIcon`, `getIssuerColor`, `ICON_PICKER_OPTIONS`, `IssuerIcon` component.

---

## Components

### `components/AppLogo.js`
App logo image. Sizes: sm (40), md (64), lg (96).

### `components/AccountCard.js`
TOTP account card. Displays issuer, label, code, countdown. Tap to copy. Actions: favorite, edit, remove.

### `components/AccountEditModal.js`
Edit account modal. Folder, notes, icon picker. Save updates to storage.

### `components/AuthModal.js`
Login and register modal. MFA wait state, backup OTP input, forgot password (device code or security code). Uses light theme for consistency across devices.

### `components/AppLockPromptModal.js`
App lock setup prompt. First-time PIN setup. Fallback when biometric unavailable. Migration support for users with biometric-only config.

### `components/AutoLockModal.js`
Auto-lock timeout picker. Never, 1, 5, 15, 30 minutes.

### `components/BiometricGate.js`
Unlock screen when app is locked. Biometric or PIN entry.

### `components/ExportImportModal.js`
Export accounts as JSON or import from pasted JSON. Share or clipboard fallback.

### `components/FloatingActionButton.js`
Floating action button for adding accounts (scan QR). Positioned bottom-right.

### `components/FoldersModal.js`
Folders management modal. Add, rename, remove. Updates accounts when renaming or removing folders.

### `components/HistoryModal.js`
Login and MFA history modal. Fetches from backend. Supports revoking login entries for other devices.

### `components/HomeScreen.js`
Main screen. Greeting, account list, search, filters, collapsible folders. Auth prompt when unauthenticated.

### `components/IntroModal.js`
Onboarding intro modal for first-time users. Slides: 2FA codes, approve logins, get started.

### `components/MfaModal.js`
MFA approve/deny modal. Displays challenge context. Signs decision with PQC keypair. Option to generate backup OTP for other device.

### `components/PinPad.js`
6-digit PIN entry component. Setup mode (enter + confirm) and verify mode.

### `components/ProfileModal.js`
Profile modal. User info, change password. Uses auth API.

### `components/ScannerModal.js`
QR scan or manual secret entry for TOTP enrollment. Camera permissions, image picker, manual form.

### `components/SettingsModal.js`
Settings modal. Profile, theme, app lock, change password, change PIN, auto-lock, manage folders, my devices, export/import, activity. Multi-screen sheet.

### `components/ui/Input.js`
Styled text input with optional label, icon, hint, error.

### `components/ui/PasswordInput.js`
Password field with show/hide toggle.

### `components/ui/index.js`
Re-exports Input and PasswordInput.
