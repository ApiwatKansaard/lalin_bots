import { validateSignature } from '@line/bot-sdk';
import { handleWebhookEvents } from '@/lib/line/webhook';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('x-line-signature') || '';

  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) {
    console.error('LINE_CHANNEL_SECRET is not set');
    return new Response('Server configuration error', { status: 500 });
  }

  if (!validateSignature(body, channelSecret, signature)) {
    return new Response('Invalid signature', { status: 403 });
  }

  const parsed = JSON.parse(body);

  // Respond immediately, process asynchronously
  handleWebhookEvents(parsed.events).catch((err) => {
    console.error('Webhook processing error:', err);
  });

  return new Response('OK', { status: 200 });
}
