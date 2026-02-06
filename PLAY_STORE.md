# Uploading QSafe to Google Play Store

Yes, you can publish QSafe to the Play Store. Follow these steps.

---

## 1. Google Play Developer account

- Go to [Google Play Console](https://play.google.com/console).
- Sign up (one-time **$25** registration fee).
- Complete identity and payment verification.

---

## 2. Build a release (AAB)

From your project root:

```bash
cd qsafe-mobile
npx eas build --platform android --profile production
```

- Sign in to Expo when prompted (or run `npx eas login` first).
- First time: EAS will ask to create a project; link it to your Expo account.
- When the build finishes, download the **Android App Bundle (.aab)** from the EAS dashboard, or use the link from the build log.

The **production** profile in `eas.json` is set to build an **app bundle** (`app-bundle`), which is what Play Store requires.

---

## 3. Create the app in Play Console

1. In Play Console: **All apps** → **Create app**.
2. Fill in:
   - App name: **QSafe**
   - Default language, type (App), and whether it’s free/paid.
3. Accept the declarations (e.g. export laws, Play policies).

---

## 4. Fill in store listing and content

- **Store listing**: Short and full description, screenshots (phone, optionally 7" tablet), feature graphic (1024×500), app icon.
- **Privacy policy**: **Required** because the app uses auth and stores user data. Host a page (e.g. on your site or GitHub Pages) that explains:
  - What data you collect (e.g. email, device id, TOTP secrets only on device).
  - How it’s used (authentication, MFA).
  - That you don’t sell data.
  Add the **privacy policy URL** in Play Console (Store listing and later in Data safety).
- **Content rating**: Complete the questionnaire (e.g. “Utility” / no sensitive content; you’ll get a rating like Everyone or similar).
- **Target audience**: Choose age groups (e.g. 18+ if you want to restrict).
- **Data safety**: Declare what you collect (e.g. email address, device ID) and that data is encrypted; link to the same privacy policy.

---

## 5. Upload the AAB

1. In Play Console: your app → **Release** → **Production** (or **Testing** first).
2. **Create new release**.
3. **Upload** the `.aab` you downloaded from EAS.
4. Add **Release name** (e.g. `1.0.0 (1)`).
5. Save and then **Review release** → **Start rollout**.

---

## 6. App signing (recommended)

- Use **Google Play App Signing**: when you upload the first AAB, Play will prompt you to enroll.
- Choose “Continue with Google Play App Signing”; EAS already signs the bundle with your upload key, and Play will re-sign for distribution. No extra step needed on your side beyond enrolling.

---

## Checklist

| Step | Done |
|------|------|
| Play Developer account ($25) | |
| `npx eas build --platform android --profile production` | |
| Create app in Play Console | |
| Store listing (text, screenshots, icon, feature graphic) | |
| Privacy policy URL | |
| Content rating | |
| Data safety form | |
| Upload AAB and roll out | |

---

## Notes

- **Expo Go**: You cannot publish “Expo Go” as your app. The production EAS build is a **standalone** build of QSafe with package name `com.qsafe.app`; that is what you upload.
- **First review**: Review can take from a few hours to several days. After that, updates usually go live faster.
- **Backend**: Ensure your backend is publicly reachable (HTTPS) and that the app’s `API_BASE_URL` points to it so the store build works for all users.

Once these are done, you can upload the app to the Play Store and publish it.
