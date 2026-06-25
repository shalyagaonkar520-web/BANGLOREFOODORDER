// Import and configure the Firebase SDK inside the service worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the Firebase config
// Note: If you change your Firebase project, please update these values accordingly.
firebase.initializeApp({
  apiKey: "AIzaSyDANM1MKe-aedlobMfOJFosQE4KP9sXDxc",
  authDomain: "momsmagic-d131a.firebaseapp.com",
  projectId: "momsmagic-d131a",
  storageBucket: "momsmagic-d131a.firebasestorage.app",
  messagingSenderId: "202524346441",
  appId: "1:202524346441:web:8e466c09c73e06fc9a9798",
  measurementId: "G-FYRRLX5ZP4"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Moms Magic';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update.',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data,
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
