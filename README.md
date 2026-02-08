# QSafe Mobile

React Native (Expo 54) app for quantum-safe authentication. TOTP codes, MFA approval, QR enrollment.

## Requirements

- Node.js 20+
- npm or yarn
- Expo CLI (`npx expo`)

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API URL |

**Local development:**

- Android emulator: `http://10.0.2.2:4000`
- Physical device: `http://YOUR_PC_IP:4000`
- iOS simulator: `http://localhost:4000`

## Run

```bash
npx expo start
```

- Press `a` for Android
- Press `i` for iOS (macOS)
- Scan QR with Expo Go on physical device

## Build (EAS)

```bash
npx eas build --platform android
npx eas build --platform ios
```

Configure `eas.json` for production.

## Key Features

- **TOTP** – Offline 6-digit codes, 30s window
- **MFA** – Approve/deny login requests (PQC-signed)
- **QR Scanner** – Add accounts via otpauth://
- **SecureStore** – PQC keys, TOTP secrets (chunked)
- **Biometric** – App lock with PIN fallback

## Environment

All env vars must be prefixed with `EXPO_PUBLIC_` to be available in the app.
