const TELEGRAM_BOT_TOKEN = '8828362126:AAGbOzb8Q9Jhi29Bp6sQ_Q6hRo4Xj2SGfQg';
const TELEGRAM_CHAT_ID = '-1003803637741';

export default async function handler(req, res) {
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
    let text;
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        text = parsed.text;
      } catch (e) {}
    } else if (req.body && typeof req.body === 'object') {
      text = req.body.text;
    }

    if (!text) {
      return res.status(400).json({ error: 'Missing message text' });
    }

    const tgResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML'
      })
    });

    const tgData = await tgResponse.json();

    if (!tgResponse.ok) {
      console.error('Telegram API error:', tgData);
      return res.status(502).json({ success: false, error: tgData.description || 'Telegram API error' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Telegram send failed:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
