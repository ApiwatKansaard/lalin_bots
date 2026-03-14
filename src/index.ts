import express from 'express';
import http from 'http';
import { middleware, MiddlewareConfig } from '@line/bot-sdk';
import { config } from './config';
import { handleWebhook } from './line/webhook';
import { setupRichMenu, relinkRegisteredUsers } from './line/richmenu';
import { getAllRegisteredLineUserIds } from './services/sheets';

const app = express();
const DASHBOARD_PORT = 3001;

// Health check (before LINE middleware so it doesn't require signature)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// LINE webhook
const middlewareConfig: MiddlewareConfig = {
  channelSecret: config.line.channelSecret,
};

app.post('/webhook', middleware(middlewareConfig), async (req, res) => {
  // Respond immediately to LINE
  res.sendStatus(200);

  // Process events asynchronously
  try {
    await handleWebhook(req.body.events);
  } catch (err) {
    console.error('Webhook processing error:', err);
  }
});

// Proxy everything else to Next.js dashboard
app.use((req, res) => {
  const proxyReq = http.request(
    {
      hostname: '127.0.0.1',
      port: DASHBOARD_PORT,
      path: req.originalUrl,
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    },
  );
  proxyReq.on('error', () => {
    res.status(502).json({ error: 'Dashboard is starting up, please try again in a few seconds' });
  });
  req.pipe(proxyReq, { end: true });
});

app.listen(config.port, async () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/health`);

  // Setup Rich Menu on startup
  await setupRichMenu();

  // Re-link registered users to the new Rich Menu
  try {
    const registeredUsers = await getAllRegisteredLineUserIds();
    await relinkRegisteredUsers(registeredUsers);
  } catch (err) {
    console.error('Failed to re-link registered users:', err);
  }
});
