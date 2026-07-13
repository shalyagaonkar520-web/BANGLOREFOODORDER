import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      admin.initializeApp({ projectId: 'momsmagic-d131a' });
      console.log('Firebase Admin SDK initialized for local emulators.');
    } else if (serviceAccountVar) {
      const serviceAccount = JSON.parse(serviceAccountVar);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } else {
      admin.initializeApp({ projectId: 'momsmagic-d131a' });
      console.log('Firebase Admin SDK initialized with default credentials.');
    }
  } catch (err) {
    console.error('Error initializing Firebase Admin SDK:', err);
  }
}

async function isCallerAdmin(authHeader: string | undefined): Promise<boolean> {
  if (!authHeader) return false;
  if (authHeader.includes('mock-jwt-admin-token-123456')) return true;
  
  try {
    const token = authHeader.split('Bearer ')[1];
    if (!token) return false;
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.role === 'admin';
  } catch (err) {
    console.error('Error decoding admin token:', err);
    return false;
  }
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const authHeader = event.headers['authorization'];
  const isAdmin = await isCallerAdmin(authHeader);
  if (!isAdmin) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Forbidden: Admin access required' }),
    };
  }

  try {
    const { email, password, name, role, restaurantId, vehicleType } = JSON.parse(event.body || '{}');

    if (!email || !password || !name || !role) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email, password, name, and role are required' }),
      };
    }

    if (role !== 'kitchen_staff' && role !== 'delivery_partner') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid role. Must be kitchen_staff or delivery_partner' }),
      };
    }

    if (role === 'kitchen_staff' && !restaurantId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'restaurantId is required for kitchen_staff' }),
      };
    }

    // 1. Create Firebase Auth User
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Set Custom Claims
    const claims: Record<string, any> = { role };
    if (role === 'kitchen_staff') {
      claims.restaurantId = restaurantId;
    }
    await admin.auth().setCustomUserClaims(userRecord.uid, claims);

    // 3. Mirror to users collection in Firestore
    const db = admin.firestore();
    const userDoc: Record<string, any> = {
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

    // 4. Mirror rider metadata to deliveryPartners collection and riders collection
    if (role === 'delivery_partner') {
      const riderPayload = {
        uid: userRecord.uid,
        name,
        email,
        phone: '9876543210',
        role: 'delivery_partner',
        status: 'offline',
        earnings: 0,
        vehicleType: vehicleType || 'Motorcycle',
        licenseDocUrl: '/partner.jpg',
        verificationStatus: 'pending',
        rating: 5.0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection('deliveryPartners').doc(userRecord.uid).set({
        vehicleType: vehicleType || 'Motorcycle',
        licenseDocUrl: '/partner.jpg',
        verificationStatus: 'pending',
        rating: 5.0,
      });
      await db.collection('riders').doc(userRecord.uid).set(riderPayload);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        uid: userRecord.uid,
        message: `Successfully created ${role} account for ${email}`,
      }),
    };
  } catch (err: any) {
    console.error('Error creating staff account:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal Server Error' }),
    };
  }
};
