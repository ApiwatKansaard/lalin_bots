import { messagingApi, WebhookEvent, MessageEvent, FollowEvent, UnfollowEvent, TextEventMessage, ImageEventMessage } from '@line/bot-sdk';
import { config } from '../config';
import {
  findHouseByLineUserId,
  findHouseByNumber,
  updateHouseLineUserId,
  getSettings,
  addPaymentRecord,
  getOutstandingBalance,
  getPaymentHistory,
  getUnpaidMonths,
  findPaymentByHouseMonthYear,
} from '../services/sheets';
import { extractSlipData, verifySlip } from '../services/slip-verification';
import {
  buildPaymentConfirmation,
  buildMultiMonthConfirmation,
  buildOutstandingBalance,
  buildPaymentHistory,
  buildHelpMessage,
  buildErrorMessage,
  buildWelcomeMessage,
  buildRegistrationPrompt,
  buildRegistrationSuccess,
  buildRegistrationError,
  buildUnsupportedMessageType,
} from './messages';
import { getRegisteredMenuId, getClient } from './richmenu';
import { RegistrationState } from '../types';

type Message = messagingApi.Message;

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: config.line.channelAccessToken,
});

const blobClient = new messagingApi.MessagingApiBlobClient({
  channelAccessToken: config.line.channelAccessToken,
});

// Registration state management
const registrationStates = new Map<string, RegistrationState>();
const REGISTRATION_TTL = 15 * 60 * 1000; // 15 minutes

// Cleanup expired registration states every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, state] of registrationStates) {
    if (now - state.timestamp > REGISTRATION_TTL) {
      registrationStates.delete(userId);
    }
  }
}, 5 * 60 * 1000);

export async function handleWebhook(events: WebhookEvent[]): Promise<void> {
  for (const event of events) {
    try {
      if (event.type === 'follow') {
        await handleFollowEvent(event as FollowEvent);
      } else if (event.type === 'unfollow') {
        handleUnfollowEvent(event as UnfollowEvent);
      } else if (event.type === 'message') {
        const messageEvent = event as MessageEvent;
        const userId = messageEvent.source.userId;
        if (!userId) continue;

        if (messageEvent.message.type === 'image') {
          await handleImageMessage(messageEvent, userId);
        } else if (messageEvent.message.type === 'text') {
          await handleTextMessage(messageEvent, userId);
        } else {
          // Sticker, video, audio, file, location
          await client.pushMessage({
            to: userId,
            messages: [buildUnsupportedMessageType()],
          });
        }
      }
    } catch (err) {
      console.error('Error handling event:', err);
    }
  }
}

async function handleFollowEvent(event: FollowEvent): Promise<void> {
  const userId = event.source.userId;
  if (!userId) return;
  await client.pushMessage({
    to: userId,
    messages: [buildWelcomeMessage()],
  });
}

function handleUnfollowEvent(event: UnfollowEvent): void {
  const userId = event.source.userId;
  console.log(`User unfollowed: ${userId}`);
  registrationStates.delete(userId);
}

async function handleRegistration(userId: string, text: string): Promise<void> {
  if (text === 'ยกเลิก') {
    registrationStates.delete(userId);
    await client.pushMessage({
      to: userId,
      messages: [{ type: 'text', text: 'ยกเลิกการลงทะเบียนแล้วค่ะ' }],
    });
    return;
  }

  const houseNumber = text.trim();
  const house = await findHouseByNumber(houseNumber);

  if (!house) {
    await client.pushMessage({
      to: userId,
      messages: [buildRegistrationError(`ไม่พบบ้านเลขที่ ${houseNumber} ในระบบ กรุณาตรวจสอบเลขบ้านอีกครั้ง`)],
    });
    return;
  }

  if (house.is_active === 'FALSE') {
    registrationStates.delete(userId);
    await client.pushMessage({
      to: userId,
      messages: [buildRegistrationError(`บ้านเลขที่ ${houseNumber} ไม่ได้เปิดใช้งานในระบบ กรุณาติดต่อกรรมการหมู่บ้าน`)],
    });
    return;
  }

  if (house.line_user_id && house.line_user_id !== userId) {
    registrationStates.delete(userId);
    await client.pushMessage({
      to: userId,
      messages: [buildRegistrationError(`บ้านเลขที่ ${houseNumber} ลงทะเบียนแล้วโดยผู้อยู่อาศัยอื่น กรุณาติดต่อกรรมการหมู่บ้าน`)],
    });
    return;
  }

  // Link user to house
  await updateHouseLineUserId(houseNumber, userId);
  registrationStates.delete(userId);

  // Switch Rich Menu to registered
  const menuId = getRegisteredMenuId();
  if (menuId) {
    await getClient().linkRichMenuIdToUser(userId, menuId);
  }

  await client.pushMessage({
    to: userId,
    messages: [buildRegistrationSuccess(house.house_number, house.resident_name) as unknown as Message],
  });
}

async function handleImageMessage(event: MessageEvent, userId: string): Promise<void> {
  try {
    const house = await findHouseByLineUserId(userId);
    if (!house) {
      await client.pushMessage({
        to: userId,
        messages: [buildErrorMessage('ไม่พบข้อมูลบ้านของคุณในระบบ กรุณากดปุ่ม "ลงทะเบียนบ้าน" ในเมนูด้านล่างเพื่อลงทะเบียนค่ะ')],
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

    const monthCount = verification.monthCount;

    // Get unpaid months and assign payments
    const unpaidMonths = await getUnpaidMonths(house.house_number, house.move_in_date);

    if (unpaidMonths.length === 0) {
      await client.pushMessage({
        to: userId,
        messages: [{ type: 'text', text: '✅ คุณไม่มียอดค้างชำระ ไม่จำเป็นต้องชำระเพิ่มค่ะ' }],
      });
      return;
    }

    const monthsToRecord = unpaidMonths.slice(0, monthCount);

    // Check for duplicate payments
    for (const m of monthsToRecord) {
      const existing = await findPaymentByHouseMonthYear(house.house_number, m.month, m.year);
      if (existing) {
        await client.pushMessage({
          to: userId,
          messages: [buildErrorMessage(`เดือน ${m.month}/${m.year} ชำระแล้ว กรุณาตรวจสอบอีกครั้ง`)],
        });
        return;
      }
    }

    const amountPerMonth = settings.monthly_fee_amount.toString();
    const payments = [];

    for (const m of monthsToRecord) {
      const payment = {
        house_number: house.house_number,
        resident_name: house.resident_name,
        month: m.month,
        year: m.year,
        amount: amountPerMonth,
        paid_date: slipData.date,
        transaction_ref: slipData.transaction_ref,
        slip_image_url: '',
        verified_status: 'verified',
        recorded_by: 'bot',
      };
      await addPaymentRecord(payment);
      payments.push(payment);
    }

    if (payments.length === 1) {
      await client.pushMessage({
        to: userId,
        messages: [buildPaymentConfirmation(payments[0], settings) as unknown as Message],
      });
    } else {
      await client.pushMessage({
        to: userId,
        messages: [buildMultiMonthConfirmation(payments, settings) as unknown as Message],
      });
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Error processing image:', errMsg, err);
    await client.pushMessage({
      to: userId,
      messages: [buildErrorMessage(`เกิดข้อผิดพลาดในการประมวลผลสลิป: ${errMsg}`)],
    });
  }
}

async function handleTextMessage(event: MessageEvent, userId: string): Promise<void> {
  try {
    const text = (event.message as TextEventMessage).text.trim();

    // Check registration state first
    if (registrationStates.has(userId)) {
      await handleRegistration(userId, text);
      return;
    }

    // Allow "ลงทะเบียน" even for unregistered users
    if (text === 'ลงทะเบียน') {
      const existingHouse = await findHouseByLineUserId(userId);
      if (existingHouse) {
        await client.pushMessage({
          to: userId,
          messages: [{ type: 'text', text: `คุณลงทะเบียนบ้านเลขที่ ${existingHouse.house_number} แล้วค่ะ` }],
        });
        return;
      }
      registrationStates.set(userId, { step: 'awaiting_house_number', timestamp: Date.now() });
      await client.pushMessage({
        to: userId,
        messages: [buildRegistrationPrompt()],
      });
      return;
    }

    // "ส่งสลิป" doesn't need house lookup or settings — respond immediately
    if (text === 'ส่งสลิป') {
      await client.pushMessage({
        to: userId,
        messages: [{ type: 'text', text: '📸 กรุณาส่งรูปสลิปการโอนเงินค่าส่วนกลางมาได้เลยค่ะ' }],
      });
      return;
    }

    // "วิธีใช้งาน" doesn't need house lookup — respond immediately
    if (/วิธีใช้งาน|ช่วยเหลือ|help/.test(text)) {
      await client.pushMessage({
        to: userId,
        messages: [buildHelpMessage()],
      });
      return;
    }

    // All remaining commands need house data
    const house = await findHouseByLineUserId(userId);
    if (!house) {
      await client.pushMessage({
        to: userId,
        messages: [buildErrorMessage('ไม่พบข้อมูลบ้านของคุณในระบบ กรุณากดปุ่ม "ลงทะเบียน" ในเมนูด้านล่างเพื่อลงทะเบียนค่ะ')],
      });
      return;
    }

    if (/เช็คยอด|ยอดค้าง|ค้างชำระ/.test(text)) {
      const settings = await getSettings();
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
      const settings = await getSettings();
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
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Error processing text:', errMsg, err);
    await client.pushMessage({
      to: userId,
      messages: [buildErrorMessage(`เกิดข้อผิดพลาด: ${errMsg}`)],
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
