import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDt3vmuzs1ldHqOhUGOOXeYX8IeiDTj0FA",
  authDomain: "calmhire-ai.firebaseapp.com",
  projectId: "calmhire-ai",
  storageBucket: "calmhire-ai.firebasestorage.app",
  messagingSenderId: "525918837426",
  appId: "1:525918837426:web:87d129d6824274aa11c7ab",
  measurementId: "G-X13C5SE3Z3"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Analytics conditionally (only on the client side where supported)
let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics, auth, db };
