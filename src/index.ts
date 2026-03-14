import express from 'express';
import { middleware, MiddlewareConfig } from '@line/bot-sdk';
import { config } from './config';
import { handleWebhook } from './line/webhook';
import { setupRichMenu } from './line/richmenu';

const app = express();

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

app.listen(config.port, async () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/health`);

  // Setup Rich Menu on startup
  await setupRichMenu();
});
