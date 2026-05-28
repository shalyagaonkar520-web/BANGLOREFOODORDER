import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  try {
    const { email, password } = JSON.parse(event.body || '{}');
    const adminEmail = process.env.ADMIN_EMAIL || 'shalyagaonkar@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Shalya@2004';

    if (email === adminEmail && password === adminPassword) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          token: 'mock-jwt-admin-token-123456',
          user: {
            id: 'admin-1',
            name: 'Shalya Gaonkar',
            email: adminEmail,
            role: 'super_admin'
          }
        }),
      };
    } else {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Invalid email or password' }),
      };
    }
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, message: 'Invalid request' }),
    };
  }
};
