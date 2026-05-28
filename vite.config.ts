import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'api-mock-server',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const settingsPath = path.resolve(__dirname, 'src/data/adminSettings.json');

            // Handle Admin Login
            if (req.url && req.url.includes('/api/login') && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', () => {
                try {
                  const data = JSON.parse(body);
                  const { email, password } = data;
                  if (email === 'shalyagaonkar@gmail.com' && password === 'Shalya@2004') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                      success: true,
                      token: 'mock-jwt-admin-token-123456',
                      user: {
                        id: 'admin-1',
                        name: 'Shalya Gaonkar',
                        email: 'shalyagaonkar@gmail.com',
                        role: 'super_admin'
                      }
                    }));
                  } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Invalid email or password' }));
                  }
                } catch (e) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, message: 'Invalid request body' }));
                }
              });
              return;
            }

            // Handle GET Admin Settings
            if (req.url && req.url.includes('/api/settings') && req.method === 'GET') {
              try {
                const settingsData = fs.readFileSync(settingsPath, 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(settingsData);
              } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Failed to load settings' }));
              }
              return;
            }

            // Handle POST Admin Settings
            if (req.url && req.url.includes('/api/settings') && req.method === 'POST') {
              const authHeader = req.headers['authorization'];
              if (!authHeader || !authHeader.includes('mock-jwt-admin-token-123456')) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Unauthorized access' }));
                return;
              }

              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', () => {
                try {
                  const newSettings = JSON.parse(body);
                  newSettings.lastUpdated = new Date().toISOString();
                  fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2), 'utf8');
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: true, settings: newSettings }));
                } catch (e) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, message: 'Invalid settings format' }));
                }
              });
              return;
            }

            next();
          });
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
