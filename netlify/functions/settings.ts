import { Handler } from '@netlify/functions';
import fs from 'fs';
import path from 'path';

// Memory cache fallback for stateless cloud functions if no database is connected
let memorySettings = {
  websiteStatus: "ON",
  maintenanceMessage: "Mom's Magic is temporarily closed. We'll reopen soon ❤️",
  openTime: "12:30",
  closeTime: "22:30",
  reopenMessage: "We will reopen normally on May 29, 2026.",
  emergencyStop: false,
  festivalMode: false,
  deliveryPause: false,
  orderLimit: 50,
  lastUpdated: new Date().toISOString(),
  whatsappNumber: "+919606001790",
  whatsappAlertsEnabled: true
};

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

  // Attempt to read the initial settings from the JSON file at build-time/bundle path
  let currentSettings = { ...memorySettings };
  try {
    const settingsPath = path.resolve(__dirname, '../../src/data/adminSettings.json');
    if (fs.existsSync(settingsPath)) {
      const fileData = fs.readFileSync(settingsPath, 'utf8');
      currentSettings = { ...currentSettings, ...JSON.parse(fileData) };
    }
  } catch (err) {
    // Silent catch, fallback to memory settings
  }

  // Handle GET Settings
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(currentSettings)
    };
  }

  // Handle POST Settings
  if (event.httpMethod === 'POST') {
    const authHeader = event.headers['authorization'];
    if (!authHeader || !authHeader.includes('mock-jwt-admin-token-123456')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Unauthorized access' })
      };
    }

    try {
      const newSettings = JSON.parse(event.body || '{}');
      newSettings.lastUpdated = new Date().toISOString();
      
      // Update memory cache
      memorySettings = { ...currentSettings, ...newSettings };
      
      // Try to write to local filesystem if accessible (e.g. Netlify Dev)
      try {
        const settingsPath = path.resolve(__dirname, '../../src/data/adminSettings.json');
        fs.writeFileSync(settingsPath, JSON.stringify(memorySettings, null, 2), 'utf8');
      } catch (err) {
        // Ephemeral container filesystem write might fail, memory storage persists for instance lifecycle
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, settings: memorySettings })
      };
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Invalid settings body' })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ message: 'Method Not Allowed' })
  };
};
