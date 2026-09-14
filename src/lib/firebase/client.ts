import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Salty Media Production Firebase Configuration
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCwRmQs8N-wxaXghy1aeiCPMzNiGOu5xrc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "salty-media-production.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "salty-media-production",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "salty-media-production.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "519410061424",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:519410061424:web:fb332f1ef1846ed1eba4b5",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-HKGZ8KHB1W",
};

// Initialize Firebase App (singleton)
export const firebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// Initialize Firebase Authentication
export const firebaseAuth = getAuth(firebaseApp);

// Configure Google Auth Provider
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: "select_account",
});

// Client-side analytics initialization (dynamically loaded to prevent Webpack SSR module crash)
export async function initAnalytics() {
  if (typeof window !== "undefined") {
    try {
      const { getAnalytics, isSupported } = await import("firebase/analytics");
      if (await isSupported()) {
        return getAnalytics(firebaseApp);
      }
    } catch (e) {
      console.warn("[Firebase Analytics] Not supported or failed to initialize:", e);
    }
  }
  return null;
}
