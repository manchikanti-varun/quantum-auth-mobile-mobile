/**
 * Google Sign-In via expo-auth-session. Returns Firebase id_token for backend.
 * Config: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_FIREBASE_* (from Firebase Console).
 */
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let firebaseApp = null;

function getFirebaseAuth() {
  if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) return null;
  if (!firebaseApp) {
    firebaseApp = initializeApp(FIREBASE_CONFIG);
  }
  return getAuth(firebaseApp);
}

export function isGoogleSignInConfigured() {
  const hasWeb = !!GOOGLE_WEB_CLIENT_ID;
  const hasAndroid = Platform.OS === 'android' ? !!GOOGLE_ANDROID_CLIENT_ID : true;
  return !!(hasWeb && hasAndroid && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
}

/**
 * Hook for Google Sign-In. Returns [signIn, loading].
 * On success, signIn resolves with { idToken } (Firebase token) or null.
 */
export function useGoogleSignIn() {
  const [request, , promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });

  const signIn = async () => {
    if (!request) return null;
    const result = await promptAsync();
    if (result?.type !== 'success') return null;
    const googleIdToken = result.params?.id_token || result.authentication?.idToken;
    if (!googleIdToken) return null;

    const auth = getFirebaseAuth();
    if (!auth) return { idToken: googleIdToken };

    const credential = GoogleAuthProvider.credential(googleIdToken);
    const userCred = await signInWithCredential(auth, credential);
    const firebaseToken = await userCred.user.getIdToken();
    return { idToken: firebaseToken };
  };

  return [signIn, !request];
}
