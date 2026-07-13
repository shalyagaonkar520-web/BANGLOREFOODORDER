import crypto from 'crypto';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } catch (error) {
    console.warn("Firebase admin initialization failed, skipping firestore save in API:", error.message);
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'dXNiyM3czTHNM9H5MUDIl5uR';

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Payment is verified
    // If order is provided, save it to Firestore
    if (order && admin.apps.length) {
      const db = admin.firestore();
      order.paymentId = razorpay_payment_id;
      order.paymentMethod = 'online';
      order.status = 'pending';
      
      await db.collection('orders').doc(order.id).set(order);
    }

    return res.status(200).json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Razorpay Verification Error:', error);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
}
