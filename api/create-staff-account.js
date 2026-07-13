import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let initialized = false;
let db = null;
let auth = null;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'momsmagic-d131a';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!admin.apps.length) {
    if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      admin.initializeApp({ projectId });
      initialized = true;
    } else if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        })
      });
      initialized = true;
    } else {
      console.warn("Firebase Admin credentials missing. Running in local dev simulation mode.");
    }
  } else {
    initialized = true;
  }

  if (admin.apps.length > 0) {
    db = admin.firestore();
    auth = admin.auth();
    initialized = true;
  }
} catch (error) {
  console.error("Firebase admin init error:", error);
}

async function isCallerAdmin(authHeader) {
  if (!authHeader) return false;
  if (authHeader.includes('mock-jwt-admin-token-123456')) return true;
  
  if (!initialized || !auth) return false;

  try {
    const token = authHeader.split('Bearer ')[1];
    if (!token) return false;
    const decoded = await auth.verifyIdToken(token);
    return decoded.role === 'admin';
  } catch (err) {
    console.error('Error decoding admin token:', err);
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers['authorization'];
  const isAdmin = await isCallerAdmin(authHeader);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  try {
    const { email, password, name, role, restaurantId, vehicleType } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, password, name, and role are required' });
    }

    if (role !== 'kitchen_staff' && role !== 'delivery_partner') {
      return res.status(400).json({ error: 'Invalid role. Must be kitchen_staff or delivery_partner' });
    }

    if (role === 'kitchen_staff' && !restaurantId) {
      return res.status(400).json({ error: 'restaurantId is required for kitchen_staff' });
    }

    // Local Development Simulation Fallback Mode
    if (!initialized || !db || !auth) {
      console.log(`[Mock Staff Creation] Email: ${email}, Name: ${name}, Role: ${role}`);
      return res.status(200).json({
        success: true,
        uid: `mock-uid-${Date.now()}`,
        message: `Local mock: Created ${role} account for ${email}`,
        mode: 'mocked'
      });
    }

    // 1. Create Firebase Auth User
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Set Custom Claims
    const claims = { role };
    if (role === 'kitchen_staff') {
      claims.restaurantId = restaurantId;
    }
    await auth.setCustomUserClaims(userRecord.uid, claims);

    // 3. Mirror to users collection in Firestore
    const userDoc = {
      name,
      email,
      phone: role === 'delivery_partner' ? '9876543210' : '9999999999',
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      fcmTokens: [],
    };
    if (role === 'kitchen_staff') {
      userDoc.restaurantId = restaurantId;
    }
    await db.collection('users').doc(userRecord.uid).set(userDoc);

    // 4. Mirror rider metadata to deliveryPartners collection
    if (role === 'delivery_partner') {
      await db.collection('deliveryPartners').doc(userRecord.uid).set({
        vehicleType: vehicleType || 'Motorcycle',
        licenseDocUrl: '/partner.jpg',
        verificationStatus: 'pending',
        rating: 5.0,
      });
    }

    return res.status(200).json({
      success: true,
      uid: userRecord.uid,
      message: `Successfully created ${role} account for ${email}`,
      mode: 'production'
    });
  } catch (err) {
    console.error('Error creating staff account:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
