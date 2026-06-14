import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDANM1MKe-aedlobMfOJFosQE4KP9sXDxc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "momsmagic-d131a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "momsmagic-d131a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "momsmagic-d131a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "202524346441",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:202524346441:web:8e466c09c73e06fc9a9798",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-FYRRLX5ZP4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
