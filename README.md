# QSafe Mobile App

React Native (Expo) mobile authenticator with TOTP, push MFA, and quantum-safe signatures.

## Setup

```bash
npm install
```

### API URL

Set your backend URL in `constants/config.js` or via env:

```bash
EXPO_PUBLIC_API_URL=https://your-backend.com npx expo start
```

### Google Sign-In (optional)

1. In Firebase Console: enable **Authentication** → **Sign-in method** → **Google**
2. Get your **Web client ID** from Firebase (Project settings → Your apps → Web app)
3. Set env vars (or app.config.js):
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` – Web client ID
   - `EXPO_PUBLIC_FIREBASE_API_KEY`
   - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
   - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `EXPO_PUBLIC_FIREBASE_APP_ID`

## Run

```bash
npx expo start
```

Press `a` for Android, `i` for iOS.

## Build APK

1. Set `API_BASE_URL` in `constants/config.js` or via `EXPO_PUBLIC_API_URL`
2. Run: `npx eas build --platform android --profile production`
3. Download APK from the build link or expo.dev

## Backup OTP (login on new device)

When logging in on a new device:

1. **Preferred**: Open QSafe on your trusted device (Device 1) → you'll see the login request → tap **Approve** or **Generate code for other device**
2. **Generate code**: On Device 1, tap "Generate code for other device" → enter the 6-digit code on Device 2
3. **TOTP fallback**: If you added the QSafe backup secret to your authenticator at registration, use that code (not your Google/GitHub TOTP codes)

## Tech Stack

- Expo SDK 54, SecureStore, expo-local-authentication, @asanrom/dilithium
