import { messagingApi, WebhookEvent, MessageEvent, TextEventMessage, ImageEventMessage } from '@line/bot-sdk';
import { config } from '../config';
import { findHouseByLineUserId, getSettings, addPaymentRecord, getOutstandingBalance, getPaymentHistory } from '../services/sheets';
import { extractSlipData, verifySlip } from '../services/slip-verification';
import {
  buildPaymentConfirmation,
  buildOutstandingBalance,
  buildPaymentHistory,
  buildHelpMessage,
  buildErrorMessage,
} from './messages';

type Message = messagingApi.Message;

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: config.line.channelAccessToken,
});

const blobClient = new messagingApi.MessagingApiBlobClient({
  channelAccessToken: config.line.channelAccessToken,
});

export async function handleWebhook(events: WebhookEvent[]): Promise<void> {
  for (const event of events) {
    if (event.type !== 'message') continue;
    const messageEvent = event as MessageEvent;
    const userId = messageEvent.source.userId;
    if (!userId) continue;

    if (messageEvent.message.type === 'image') {
      await handleImageMessage(messageEvent, userId);
    } else if (messageEvent.message.type === 'text') {
      await handleTextMessage(messageEvent, userId);
    }
  }
}

async function handleImageMessage(event: MessageEvent, userId: string): Promise<void> {
  try {
    const house = await findHouseByLineUserId(userId);
    if (!house) {
      await client.pushMessage({
        to: userId,
        messages: [buildErrorMessage('ไม่พบข้อมูลบ้านของคุณในระบบ กรุณาติดต่อกรรมการหมู่บ้านเพื่อลงทะเบียน')],
      });
      return;
    }

    const imageMessage = event.message as ImageEventMessage;
    const imageBuffer = await downloadContent(imageMessage.id);

    const [slipData, settings] = await Promise.all([
      extractSlipData(imageBuffer),
      getSettings(),
    ]);

    if (!slipData) {
      await client.pushMessage({
        to: userId,
        messages: [buildErrorMessage('ไม่สามารถอ่านข้อมูลจากสลิปได้ กรุณาถ่ายภาพใหม่ให้ชัดเจน')],
      });
      return;
    }

    const verification = await verifySlip(slipData, settings);
    if (!verification.valid) {
      await client.pushMessage({
        to: userId,
        messages: [buildErrorMessage(verification.error_message!)],
      });
      return;
    }

    const now = new Date();
    const payment = {
      house_number: house.house_number,
      resident_name: house.resident_name,
      month: (now.getMonth() + 1).toString(),
      year: now.getFullYear().toString(),
      amount: slipData.amount.toString(),
      paid_date: slipData.date,
      transaction_ref: slipData.transaction_ref,
      slip_image_url: '',
      verified_status: 'verified',
      recorded_by: 'bot',
    };

    await addPaymentRecord(payment);

    await client.pushMessage({
      to: userId,
      messages: [buildPaymentConfirmation(payment, settings) as unknown as Message],
    });
  } catch (err) {
    console.error('Error processing image:', err);
    await client.pushMessage({
      to: userId,
      messages: [buildErrorMessage('เกิดข้อผิดพลาดในการประมวลผลสลิป กรุณาลองใหม่อีกครั้ง')],
    });
  }
}

async function handleTextMessage(event: MessageEvent, userId: string): Promise<void> {
  try {
    const text = (event.message as TextEventMessage).text.trim();

    const house = await findHouseByLineUserId(userId);
    if (!house) {
      await client.pushMessage({
        to: userId,
        messages: [buildErrorMessage('ไม่พบข้อมูลบ้านของคุณในระบบ กรุณาติดต่อกรรมการหมู่บ้านเพื่อลงทะเบียน')],
      });
      return;
    }

    const settings = await getSettings();

    if (text === 'ส่งสลิป') {
      await client.pushMessage({
        to: userId,
        messages: [{ type: 'text', text: '📸 กรุณาส่งรูปสลิปการโอนเงินค่าส่วนกลางมาได้เลยค่ะ' }],
      });
      return;
    }

    if (/เช็คยอด|ยอดค้าง|ค้างชำระ/.test(text)) {
      const balance = await getOutstandingBalance(house.house_number, house.move_in_date, settings.monthly_fee_amount);
      const msg = buildOutstandingBalance(
        settings.village_name,
        house.house_number,
        balance.totalOwed,
        balance.unpaidMonths,
        settings.monthly_fee_amount,
      );
      await client.pushMessage({ to: userId, messages: [msg as unknown as Message] });
      return;
    }

    if (/ประวัติ|การจ่าย|history/.test(text)) {
      const payments = await getPaymentHistory(house.house_number);
      const msg = buildPaymentHistory(payments, settings.village_name);
      await client.pushMessage({ to: userId, messages: [msg as unknown as Message] });
      return;
    }

    if (/สถานะ|จ่ายแล้วยัง|เช็คสถานะ/.test(text)) {
      const now = new Date();
      const currentMonth = (now.getMonth() + 1).toString();
      const currentYear = now.getFullYear().toString();
      const payments = await getPaymentHistory(house.house_number);
      const paid = payments.find((p) => p.month === currentMonth && p.year === currentYear);

      if (paid) {
        await client.pushMessage({
          to: userId,
          messages: [{ type: 'text', text: `✅ บ้านเลขที่ ${house.house_number} ชำระค่าส่วนกลางเดือน ${currentMonth}/${currentYear} แล้ว` }],
        });
      } else {
        await client.pushMessage({
          to: userId,
          messages: [{ type: 'text', text: `⏳ บ้านเลขที่ ${house.house_number} ยังไม่ได้ชำระค่าส่วนกลางเดือน ${currentMonth}/${currentYear}` }],
        });
      }
      return;
    }

    // Unrecognized
    await client.pushMessage({
      to: userId,
      messages: [buildHelpMessage()],
    });
  } catch (err) {
    console.error('Error processing text:', err);
    await client.pushMessage({
      to: userId,
      messages: [buildErrorMessage('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')],
    });
  }
}

async function downloadContent(messageId: string): Promise<Buffer> {
  const response = await blobClient.getMessageContent(messageId);
  const chunks: Buffer[] = [];
  const stream = response as unknown as NodeJS.ReadableStream;
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as unknown as Uint8Array));
  }
  return Buffer.concat(chunks);
}
