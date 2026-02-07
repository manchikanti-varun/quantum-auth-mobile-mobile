# QSafe Mobile App

React Native (Expo) mobile authenticator with TOTP, push MFA, and quantum-safe signatures.

## Setup

```bash
npm install
```

### API URL

Set your backend URL in `constants/config.js`:

```js
export const API_BASE_URL = 'https://your-backend-url.com';
```

Or use env: `EXPO_PUBLIC_API_URL=https://your-url.com npx expo start`

## Run

```bash
npx expo start
```

Press `a` for Android, `i` for iOS.

## Build APK

1. Set `API_BASE_URL` in `constants/config.js` or via `EXPO_PUBLIC_API_URL`
2. Run: `npx eas build --platform android --profile production`
3. Download APK from the build link or expo.dev

## Share APK (no Play Store)

Upload the APK to Google Drive, Dropbox, or WeTransfer. Share the link. Users may need to allow "Install unknown apps".

## Publish to Play Store

1. Create a Google Play Developer account ($25)
2. Build AAB (same EAS command with app-bundle profile)
3. Create app in Play Console, add store listing, privacy policy, content rating
4. Upload AAB and roll out

## Tech Stack

- Expo SDK 54, SecureStore, expo-local-authentication, @asanrom/dilithium
