import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
export const db = getFirestore(app);

/**
 * Requests browser notification permission, registers the service worker,
 * retrieves the FCM registration token, and saves it to Firestore.
 */
export const requestForToken = async (): Promise<string | null> => {
  try {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported in this browser.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Use the active PWA service worker (sw.js) which imports /firebase-messaging-sw.js
      const registration = await navigator.serviceWorker.ready;

      // Get FCM token
      const currentToken = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: 'BEGabbTzNBXMxN2aid3HvFe6ehKGSJnS7JrwVaE79ySe9HhgLQ6UkmdfZpumQzeMRC3lGq5pdTJzgSfOFshxRSI',
      });

      if (currentToken) {
        console.log('FCM Registration Token retrieved successfully:', currentToken);

        // Save token to Firestore deviceTokens collection.
        // Using the token as the document ID prevents duplicate entries.
        const tokenDocRef = doc(db, 'deviceTokens', currentToken);
        await setDoc(
          tokenDocRef,
          {
            token: currentToken,
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
          { merge: true }
        );

        return currentToken;
      } else {
        console.warn('No registration token available. Request permission to generate one.');
      }
    } else {
      console.warn('Notification permission was not granted (status:', permission, ').');
    }
  } catch (error) {
    console.error('An error occurred while getting FCM token or saving to Firestore:', error);
  }
  return null;
};

/**
 * Subscribes to foreground push notification events.
 * Returns an unsubscribe function.
 */
export const onMessageListener = (callback: (payload: any) => void) => {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};
