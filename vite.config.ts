import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'logo.png', 'pwa-icon-192.png', 'pwa-icon-512.png'],
        manifest: {
          name: "Mom's Magic",
          short_name: "Mom's Magic",
          description: "Order fresh food online from Mom's Magic. Fast delivery in Yellapur, Dandeli and nearby areas.",
          theme_color: "#050505",
          background_color: "#050505",
          display: "standalone",
          orientation: "portrait",
          start_url: ".",
          scope: "/",
          icons: [
            {
              src: "pwa-icon-192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "pwa-icon-512.png",
              sizes: "512x512",
              type: "image/png"
            },
            {
              src: "pwa-icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg,ico,json}'],
          // Import the Firebase Cloud Messaging service worker script
          // to combine FCM background push alerts with PWA offline caching!
          importScripts: ['/firebase-messaging-sw.js']
        },
        devOptions: {
          enabled: false,
          type: 'module'
        }
      }),
      {
        name: 'api-mock-server',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const settingsPath = path.resolve(__dirname, 'src/data/adminSettings.json');

            // Handle Admin Login
            if (req.url && req.url.includes('/api/login') && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', () => {
                try {
                  const data = JSON.parse(body);
                  const { email = '', password = '' } = data;
                  if (email.trim().toLowerCase() === 'shalyagaonkar@gmail.com' && password.trim() === 'Shalya@2004') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                      success: true,
                      token: 'mock-jwt-admin-token-123456',
                      user: {
                        id: 'admin-1',
                        name: 'Shalya Gaonkar',
                        email: 'shalyagaonkar@gmail.com',
                        role: 'super_admin'
                      }
                    }));
                  } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Invalid email or password' }));
                  }
                } catch (e) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, message: 'Invalid request body' }));
                }
              });
              return;
            }

            // Handle GET Admin Settings
            if (req.url && req.url.includes('/api/settings') && req.method === 'GET') {
              try {
                const settingsData = fs.readFileSync(settingsPath, 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(settingsData);
              } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Failed to load settings' }));
              }
              return;
            }

            // Handle POST Admin Settings
            if (req.url && req.url.includes('/api/settings') && req.method === 'POST') {
              const authHeader = req.headers['authorization'];
              if (!authHeader || !authHeader.includes('mock-jwt-admin-token-123456')) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Unauthorized access' }));
                return;
              }

              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', () => {
                try {
                  const newSettings = JSON.parse(body);
                  newSettings.lastUpdated = new Date().toISOString();
                  fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2), 'utf8');
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: true, settings: newSettings }));
                } catch (e) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, message: 'Invalid settings format' }));
                }
              });
              return;
            }

            // Handle POST Send Telegram (LOCAL DEV MOCK)
            // The dev machine's network blocks api.telegram.org from Node.js.
            // Return 503 immediately so the browser's built-in direct fallback
            // in Checkout.tsx takes over — it calls Telegram directly from the
            // browser, which is NOT blocked. No error logging needed here.
            if (req.url && req.url.includes('/api/send-telegram') && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', () => {
                // Drain the body so the socket isn't left hanging
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: false,
                  error: 'Local dev: proxy unavailable – browser direct call will handle this'
                }));
              });
              return;
            }

            // Handle POST Send Push Notification (LOCAL DEV MOCK)
            if (req.url && req.url.includes('/api/send-push') && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', () => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: true,
                  successCount: 3,
                  failureCount: 0,
                  message: 'Local dev mock: Broadcasted push alert to 3 active PWA installations.'
                }));
              });
              return;
            }

            // Handle POST Create Staff Account (LOCAL DEV BACKEND MOCK)
            if (req.url && req.url.includes('/api/create-staff-account') && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  const { email, password, name, role, restaurantId, vehicleType } = data;

                  // Dynamic import firebase-admin
                  const { default: admin } = (await import('firebase-admin')) as any;
                  if (!admin.apps.length) {
                    admin.initializeApp({
                      projectId: 'momsmagic-d131a'
                    });
                  }

                  const auth = admin.auth();
                  const db = admin.firestore();

                  // Create user
                  let userRecord;
                  try {
                    userRecord = await auth.getUserByEmail(email);
                    console.log('User already exists in emulator:', email);
                  } catch (e) {
                    userRecord = await auth.createUser({
                      email,
                      password,
                      displayName: name
                    });
                  }

                  // Set claims
                  const claims: any = { role };
                  if (role === 'kitchen_staff') {
                    claims.restaurantId = restaurantId;
                  }
                  await auth.setCustomUserClaims(userRecord.uid, claims);

                  // Sync to Firestore
                  const userDoc: any = {
                    name,
                    email,
                    phone: role === 'delivery_partner' ? '9876543210' : '9999999999',
                    role,
                    createdAt: new Date().toISOString(),
                    fcmTokens: []
                  };
                  if (role === 'kitchen_staff') {
                    userDoc.restaurantId = restaurantId;
                  }
                  await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });

                  if (role === 'delivery_partner') {
                    await db.collection('deliveryPartners').doc(userRecord.uid).set({
                      vehicleType: vehicleType || 'Motorcycle',
                      licenseDocUrl: '/partner.jpg',
                      verificationStatus: 'approved',
                      rating: 5.0
                    }, { merge: true });
                  }

                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({
                    success: true,
                    uid: userRecord.uid,
                    message: `Local backend: Created ${role} account for ${email}`
                  }));
                } catch (err: any) {
                  console.error('Local dev staff creation failed:', err);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: err.message }));
                }
              });
              return;
            }

            // Handle POST Create Razorpay Order (LOCAL DEV BACKEND MOCK)
            if (req.url && req.url.includes('/api/create-razorpay-order') && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  const { amount } = JSON.parse(body);
                  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_live_StCGrX25cCk27O';
                  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'dXNiyM3czTHNM9H5MUDIl5uR';

                  // Try to call real Razorpay if configured, else fallback to mock order id
                  try {
                    const authString = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
                    const response = await fetch('https://api.razorpay.com/v1/orders', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${authString}`
                      },
                      body: JSON.stringify({
                        amount: Math.round(amount * 100),
                        currency: 'INR',
                        receipt: `receipt_order_${Date.now()}`
                      })
                    });
                    const resData = await response.json();
                    if (response.ok) {
                      res.writeHead(200, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({ id: resData.id, amount: resData.amount, currency: resData.currency }));
                      return;
                    }
                  } catch (e) {
                    console.warn('Real Razorpay call failed in local dev, falling back to mock order:', e);
                  }

                  // Mock order fallback
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({
                    id: `order_mock_${Date.now()}`,
                    amount: amount * 100,
                    currency: 'INR'
                  }));
                } catch (err: any) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }

            // Handle POST Verify Razorpay Payment (LOCAL DEV BACKEND MOCK)
            if (req.url && req.url.includes('/api/verify-razorpay-payment') && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, order } = JSON.parse(body);
                  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'dXNiyM3czTHNM9H5MUDIl5uR';

                  const isMock = razorpay_order_id.startsWith('order_mock');
                  if (!isMock) {
                    // Real verification
                    const crypto = await import('crypto');
                    const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
                    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
                    const generatedSignature = hmac.digest('hex');
                    if (generatedSignature !== razorpay_signature) {
                      res.writeHead(400, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({ error: 'Signature verification failed' }));
                      return;
                    }
                  }

                  // Initialize firebase-admin
                  const { default: admin } = (await import('firebase-admin')) as any;
                  if (!admin.apps.length) {
                    admin.initializeApp({
                      projectId: 'momsmagic-d131a'
                    });
                  }

                  const db = admin.firestore();
                  const orderId = order.id || Date.now().toString();

                  const orderDoc = {
                    ...order,
                    id: orderId,
                    status: 'pending',
                    paymentStatus: 'paid',
                    paymentMethod: 'online',
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    updatedAt: new Date().toISOString()
                  };

                  const batch = db.batch();
                  batch.set(db.collection('orders').doc(orderId), orderDoc);
                  batch.set(db.collection('payments').doc(razorpay_payment_id), {
                    id: razorpay_payment_id,
                    orderId: orderId,
                    userId: order.userId || null,
                    userName: order.userName || 'Guest',
                    amount: order.payableAmount || order.grandTotal,
                    currency: 'INR',
                    paymentMethod: 'online',
                    status: 'paid',
                    createdAt: new Date().toISOString()
                  });

                  if (order.userId && order.walletAmountUsed > 0) {
                    batch.update(db.collection('users').doc(order.userId), {
                      walletBalance: admin.firestore.FieldValue.increment(-order.walletAmountUsed),
                      updatedAt: new Date().toISOString()
                    });
                    batch.set(db.collection('walletLogs').doc(), {
                      userId: order.userId,
                      orderId: orderId,
                      amount: -order.walletAmountUsed,
                      type: 'purchase',
                      description: `Paid for order #${orderId}`,
                      createdAt: new Date().toISOString()
                    });
                  }

                  await batch.commit();

                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: true, orderId }));
                } catch (err: any) {
                  console.error('Local verify failed:', err);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }

            next();
          });
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-motion': ['framer-motion'],
            'vendor-lucide': ['lucide-react'],
            'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth']
          }
        }
      }
    }
  };
});
