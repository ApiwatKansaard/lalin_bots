import { messagingApi } from '@line/bot-sdk';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: config.line.channelAccessToken,
});

const blobClient = new messagingApi.MessagingApiBlobClient({
  channelAccessToken: config.line.channelAccessToken,
});

export async function setupRichMenu(): Promise<void> {
  try {
    // Check if a rich menu image exists
    const imagePath = path.join(__dirname, '../../assets/richmenu.png');
    if (!fs.existsSync(imagePath)) {
      console.log('Rich Menu image not found at assets/richmenu.png — skipping Rich Menu setup.');
      console.log('To enable Rich Menu, place a 2500x843 PNG image at assets/richmenu.png and restart.');
      return;
    }

    const richMenu = await client.createRichMenu({
      size: { width: 2500, height: 843 },
      selected: true,
      name: 'Village Payment Menu',
      chatBarText: 'เมนู',
      areas: [
        {
          bounds: { x: 0, y: 0, width: 833, height: 843 },
          action: { type: 'message', text: 'ส่งสลิป' },
        },
        {
          bounds: { x: 833, y: 0, width: 834, height: 843 },
          action: { type: 'message', text: 'เช็คยอดค้าง' },
        },
        {
          bounds: { x: 1667, y: 0, width: 833, height: 843 },
          action: { type: 'message', text: 'ประวัติการจ่าย' },
        },
      ],
    });

    // Upload image
    const imageData = fs.readFileSync(imagePath);
    await blobClient.setRichMenuImage(richMenu.richMenuId, new Blob([imageData], { type: 'image/png' }));

    await client.setDefaultRichMenu(richMenu.richMenuId);
    console.log(`Rich Menu created and set as default: ${richMenu.richMenuId}`);
  } catch (err) {
    console.error('Failed to setup Rich Menu:', err);
  }
}
