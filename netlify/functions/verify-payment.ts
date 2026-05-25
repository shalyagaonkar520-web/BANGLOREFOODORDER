import crypto from 'crypto';

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
    const bodyData = JSON.parse(event.body || '{}');
    console.log("[Netlify Function] Verifying payment signature...", bodyData);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = bodyData;
    
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay key secret is not defined in environment variables.");
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      console.log("[Netlify Function] Signature verified successfully!");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    } else {
      console.error("[Netlify Function] Signature mismatch!");
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: "Signature mismatch" }),
      };
    }
  } catch (error: any) {
    console.error("[Netlify Function] Error verifying signature:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Error verifying signature", 
        details: error.message || String(error) 
      }),
    };
  }
};
