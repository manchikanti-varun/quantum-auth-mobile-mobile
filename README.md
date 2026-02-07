# QSafe Mobile

React Native (Expo) authenticator app with TOTP, push MFA, and quantum-safe signatures.

## Features

- **TOTP**: Add accounts via QR scan or manual entry
- **MFA**: Approve/deny login requests on another device
- **PQC**: Dilithium2 quantum-safe signatures for MFA
- **Backup OTP**: 6-digit code or TOTP for login when other device is offline
- **App lock**: PIN or biometric

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set `EXPO_PUBLIC_API_URL` to your backend URL.

## Run

```bash
npx expo start
```

Press `a` for Android, `i` for iOS.

### Local development

When testing against a local backend:

- **Physical device** (same WiFi): `EXPO_PUBLIC_API_URL=http://YOUR_IP:4000` (e.g. `http://192.168.1.21:4000`)
- **Android emulator**: `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000`
- **iOS simulator**: `EXPO_PUBLIC_API_URL=http://localhost:4000`

Restart Expo after changing `.env` (`npx expo start --clear`).

## Production build

1. Set `EXPO_PUBLIC_API_URL` in `.env` to your production backend URL.
2. Build:

   ```bash
   npx eas build --platform android --profile production
   ```

3. Download the APK from the build link or expo.dev.

## Backup OTP (login on new device)

When logging in on a new device:

1. **Preferred**: Open QSafe on your trusted device → approve or deny the request.
2. **Generate code**: On the trusted device, tap "Generate code for other device" → enter the 6-digit code on the new device.
3. **TOTP fallback**: Use the backup secret you added to your authenticator at registration.

## Tech stack

- Expo SDK 54
- SecureStore, expo-local-authentication
- @asanrom/dilithium (PQC signatures)
- expo-notifications (push)
