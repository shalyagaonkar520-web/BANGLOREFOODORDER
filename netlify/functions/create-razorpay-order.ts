import { Handler } from '@netlify/functions';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_live_StCGrX25cCk27O';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'dXNiyM3czTHNM9H5MUDIl5uR';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const { amount } = JSON.parse(event.body || '{}');
    if (!amount || typeof amount !== 'number') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing or invalid amount. Must be a number in INR.' })
      };
    }

    const authString = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // convert to paise
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}`
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Razorpay API error:', data);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: data.error?.description || 'Razorpay order creation failed' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: data.id,
        amount: data.amount,
        currency: data.currency
      })
    };
  } catch (err: any) {
    console.error('Create Razorpay order failed:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
