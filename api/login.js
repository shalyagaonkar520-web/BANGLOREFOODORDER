export default function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { email = '', password = '' } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL || 'shalyagaonkar@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Shalya@2004';

    if (email.trim().toLowerCase() === adminEmail && password.trim() === adminPassword) {
      return res.status(200).json({
        success: true,
        token: 'mock-jwt-admin-token-123456',
        user: {
          id: 'admin-1',
          name: 'Shalya Gaonkar',
          email: adminEmail,
          role: 'super_admin'
        }
      });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Invalid request body' });
  }
}
