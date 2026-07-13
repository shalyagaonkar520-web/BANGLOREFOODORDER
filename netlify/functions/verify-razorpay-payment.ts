import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import { createHmac } from 'crypto';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'dXNiyM3czTHNM9H5MUDIl5uR';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountVar) {
      const serviceAccount = JSON.parse(serviceAccountVar);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } else {
      admin.initializeApp({
        projectId: 'momsmagic-d131a'
      });
      console.log('Firebase Admin SDK initialized with projectId.');
    }
  } catch (err) {
    console.error('Error initializing Firebase Admin SDK:', err);
  }
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, order } = JSON.parse(event.body || '{}');

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !order) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing payment or order parameters.' })
      };
    }

    // Verify signature
    const hmac = createHmac('sha256', RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Razorpay signature verification failed. Untrusted request.' })
      };
    }

    const db = admin.firestore();
    const orderId = order.id || Date.now().toString();

    // Prepare complete order details
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

    // Use a transaction or batch to deduct wallet and save order securely
    const batch = db.batch();

    // 1. Save order to Firestore
    const orderRef = db.collection('orders').doc(orderId);
    batch.set(orderRef, orderDoc);

    // 2. Save payment details
    const paymentRef = db.collection('payments').doc(razorpay_payment_id);
    batch.set(paymentRef, {
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

    // 3. Deduct wallet balance if wallet was used
    if (order.userId && order.walletAmountUsed > 0) {
      const userRef = db.collection('users').doc(order.userId);
      batch.update(userRef, {
        walletBalance: admin.firestore.FieldValue.increment(-order.walletAmountUsed),
        updatedAt: new Date().toISOString()
      });

      // Log wallet transaction
      const walletLogRef = db.collection('walletLogs').doc();
      batch.set(walletLogRef, {
        userId: order.userId,
        orderId: orderId,
        amount: -order.walletAmountUsed,
        type: 'purchase',
        description: `Paid for order #${orderId}`,
        createdAt: new Date().toISOString()
      });
    }

    await batch.commit();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        orderId: orderId,
        message: 'Payment verified and order saved successfully.'
      })
    };
  } catch (err: any) {
    console.error('Payment verification failed:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal server error during verification' })
    };
  }
};
