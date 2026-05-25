import Razorpay from 'razorpay';

export const handler = async (event: any, context: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle CORS preflight options request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    console.log(`[Netlify Function] Creating Razorpay order for amount: ${body.amount} ...`);
    
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials are not defined in environment variables.");
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: body.amount, // amount in the smallest currency unit
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    console.log(`[Netlify Function] Order created successfully: ${order.id}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...order,
        key_id: process.env.RAZORPAY_KEY_ID
      }),
    };
  } catch (error: any) {
    console.error("[Netlify Function] Error creating order:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Error creating order", 
        details: error.message || String(error)
      }),
    };
  }
};
