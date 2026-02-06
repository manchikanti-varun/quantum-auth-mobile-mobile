# Build APK (backend on Railway)

## 1. Set your Railway backend URL

- Open **Railway** → your project → backend service → **Settings** → **Networking**.
- Copy the **Public URL** (e.g. `https://web-production-xxxx.up.railway.app`).
- In this repo open **`constants/config.js`** and set:
  ```js
  export const API_BASE_URL = 'https://YOUR_RAILWAY_URL_HERE';
  ```
  (Replace `YOUR_RAILWAY_URL_HERE` with the URL you copied, no trailing slash.)

  Or when building, you can pass the URL as env:
  ```bash
  EXPO_PUBLIC_API_URL=https://your-url.up.railway.app npx eas build --platform android --profile production
  ```
  (On Windows PowerShell use: `$env:EXPO_PUBLIC_API_URL="https://your-url.up.railway.app"; npx eas build --platform android --profile production`)

## 2. Build the APK

```bash
cd qsafe-mobile
npx eas build --platform android --profile production
```

- Sign in with Expo if prompted (`npx eas login`).
- Wait for the build to finish (EAS builds in the cloud).

## 3. Get the APK

- In the terminal you’ll get a **build URL** (or open [expo.dev](https://expo.dev) → your account → **Builds**).
- Open the build and click **Download** to get the `.apk` file.
- That’s the file you can share with users or install on your phone.

I can’t send you the APK directly; you run the build and download it from the link above.
