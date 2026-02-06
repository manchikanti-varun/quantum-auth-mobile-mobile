# Share QSafe with users (no Play Store, no payment)

You can build an **APK** and send it to users. They install it directly on their phones—no Play Store or developer fee.

---

## 1. Build the APK

```bash
cd qsafe-mobile
npx eas build --platform android --profile production
```

- Sign in with Expo if asked (`npx eas login`).
- When the build finishes, EAS will give you a **download link** for the APK. You can also download it from [expo.dev](https://expo.dev) → your project → Builds.

The **production** profile is set to build an **APK** (not app bundle), so you get a single `.apk` file.

---

## 2. Share the APK with users

- **Option A:** Upload the APK to **Google Drive**, **Dropbox**, or **WeTransfer**, set link to “Anyone with the link”, and send the link to users.
- **Option B:** Host it on your own server or GitHub Releases and share that link.
- **Option C:** Send the APK file by email or chat (works for small groups; some apps block .apk attachments).

Tell users: “Download the APK from this link, then open it on your Android phone to install QSafe.”

---

## 3. How users install the APK

On Android, installing from outside the Play Store is called “sideloading”.

1. **Download** the APK (from your link) on their phone.
2. **Open** the downloaded file. If they don’t see it, check **Downloads** or the browser’s download list.
3. If Android says **“Install blocked”** or **“For your security, your phone currently isn’t allowed to install unknown apps”**:
   - They tap **Settings** and turn on **Allow from this source** (Chrome, Files, or the app they used to download).
   - Then go back and tap the APK again to install.
4. Tap **Install** and then **Open**.

*(On some phones the option is under Settings → Security → Install unknown apps, and they choose the browser or file manager.)*

---

## 4. Backend and API URL

- Your **backend** must be reachable by everyone (e.g. deployed with a public URL and HTTPS).
- In `qsafe-mobile/constants/config.js`, set **`API_BASE_URL`** to that URL (e.g. `https://your-api.com`).
- **Rebuild the APK** after changing `API_BASE_URL` so the new build points to the right server.

If the backend is only on your PC or local network, only people on the same network can use the app. For “users anywhere”, deploy the backend (e.g. Railway, Render, Fly.io) and use that URL.

---

## 5. New versions

When you fix bugs or add features:

1. Update version in `app.json` if you want (e.g. `"version": "1.0.1"`).
2. Run the same build command again:
   ```bash
   npx eas build --platform android --profile production
   ```
3. Download the new APK and share it the same way. Users install the new APK over the old one (data is kept).

---

## Summary

| You do | Users do |
|--------|----------|
| Build APK with EAS | Download APK from your link |
| Share download link | Allow “Install unknown apps” for browser/Files |
| (Optional) Deploy backend and set `API_BASE_URL` | Open APK and tap Install → Open |

No Play Store, no payment—just build, share the APK, and they install it.
