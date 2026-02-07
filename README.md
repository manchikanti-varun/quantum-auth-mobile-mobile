# QSafe Mobile App

React Native (Expo) mobile authenticator with TOTP, push MFA, and quantum-safe signatures.

## Setup

```bash
npm install
```

### API URL

Set your backend URL in `.env`:

```bash
EXPO_PUBLIC_API_URL=https://your-backend.com
```

Copy `.env.example` to `.env` and fill in your values.

## Run

```bash
npx expo start
```

Press `a` for Android, `i` for iOS.

## Build APK

1. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to your backend URL
2. Run: `npx eas build --platform android --profile production`
3. Download APK from the build link or expo.dev

## Backup OTP (login on new device)

When logging in on a new device:

1. **Preferred**: Open QSafe on your trusted device (Device 1) → you'll see the login request → tap **Approve** or **Generate code for other device**
2. **Generate code**: On Device 1, tap "Generate code for other device" → enter the 6-digit code on Device 2
3. **TOTP fallback**: If you added the QSafe backup secret to your authenticator at registration, use that code (not your Google/GitHub TOTP codes)

## Tech Stack

- Expo SDK 54, SecureStore, expo-local-authentication, @asanrom/dilithium
