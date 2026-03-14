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

let registeredMenuId: string | null = null;

export function getRegisteredMenuId(): string | null {
  return registeredMenuId;
}

export function getClient(): messagingApi.MessagingApiClient {
  return client;
}

async function deleteAllRichMenus(): Promise<void> {
  const response = await client.getRichMenuList();
  const menus = response.richmenus ?? [];
  for (const menu of menus) {
    await client.deleteRichMenu(menu.richMenuId);
  }
  if (menus.length > 0) {
    console.log(`Deleted ${menus.length} existing Rich Menu(s)`);
  }
}

async function uploadRichMenuImage(menuId: string, imagePath: string): Promise<void> {
  const imageData = fs.readFileSync(imagePath);
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  await blobClient.setRichMenuImage(menuId, new Blob([imageData], { type: mimeType }));
}

export async function setupRichMenu(): Promise<void> {
  try {
    const unregisteredImagePath = path.join(__dirname, '../../assets/richmenu-unregistered.jpg');
    const registeredImagePath = path.join(__dirname, '../../assets/richmenu-registered.jpg');

    // Try .png fallback if .jpg not found
    const unregImg = fs.existsSync(unregisteredImagePath)
      ? unregisteredImagePath
      : unregisteredImagePath.replace('.jpg', '.png');
    const regImg = fs.existsSync(registeredImagePath)
      ? registeredImagePath
      : registeredImagePath.replace('.jpg', '.png');

    if (!fs.existsSync(unregImg) || !fs.existsSync(regImg)) {
      console.log('Rich Menu images not found — skipping Rich Menu setup.');
      console.log('Required: assets/richmenu-unregistered.png (2500×843) and assets/richmenu-registered.png (2500×1686)');
      return;
    }

    // Clean up old menus
    await deleteAllRichMenus();

    // Create unregistered menu (2500×843, single button)
    const unregisteredMenu = await client.createRichMenu({
      size: { width: 2500, height: 843 },
      selected: true,
      name: 'Unregistered Menu',
      chatBarText: 'เมนู',
      areas: [
        {
          bounds: { x: 0, y: 0, width: 2500, height: 843 },
          action: { type: 'message', text: 'ลงทะเบียน' },
        },
      ],
    });
    await uploadRichMenuImage(unregisteredMenu.richMenuId, unregImg);
    await client.setDefaultRichMenu(unregisteredMenu.richMenuId);
    console.log(`Unregistered Rich Menu created and set as default: ${unregisteredMenu.richMenuId}`);

    // Create registered menu (2500×1686, 2×2 grid)
    const registeredMenu = await client.createRichMenu({
      size: { width: 2500, height: 1686 },
      selected: true,
      name: 'Registered Menu',
      chatBarText: 'เมนู',
      areas: [
        {
          bounds: { x: 0, y: 0, width: 1250, height: 843 },
          action: { type: 'message', text: 'ส่งสลิป' },
        },
        {
          bounds: { x: 1250, y: 0, width: 1250, height: 843 },
          action: { type: 'message', text: 'เช็คยอดค้าง' },
        },
        {
          bounds: { x: 0, y: 843, width: 1250, height: 843 },
          action: { type: 'message', text: 'ประวัติการจ่าย' },
        },
        {
          bounds: { x: 1250, y: 843, width: 1250, height: 843 },
          action: { type: 'message', text: 'วิธีใช้งาน' },
        },
      ],
    });
    await uploadRichMenuImage(registeredMenu.richMenuId, regImg);
    registeredMenuId = registeredMenu.richMenuId;
    console.log(`Registered Rich Menu created: ${registeredMenu.richMenuId}`);
  } catch (err) {
    console.error('Failed to setup Rich Menu:', err);
  }
}
