import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { SlipData, VerificationResult, VillageSettings } from '../types';
import { findPaymentByTransactionRef } from './sheets';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export async function extractSlipData(imageBuffer: Buffer): Promise<SlipData | null> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const base64Image = imageBuffer.toString('base64');

  const prompt = `วิเคราะห์รูปสลิปการโอนเงินนี้ และส่งข้อมูลกลับมาในรูปแบบ JSON เท่านั้น ห้ามมีข้อความอื่นนอกจาก JSON

ข้อมูลที่ต้องการ:
- amount: จำนวนเงินที่โอน (ตัวเลข ไม่มีสกุลเงิน)
- date: วันที่โอน (รูปแบบ YYYY-MM-DD)
- sending_bank: ธนาคารผู้โอน
- receiving_bank: ธนาคารผู้รับ
- receiving_account_number: เลขบัญชีผู้รับ
- transaction_ref: หมายเลขอ้างอิงการทำรายการ
- is_authentic: true ถ้าสลิปดูเป็นของจริง, false ถ้าสงสัยว่าถูกแก้ไขหรือปลอม (ตรวจสอบฟอนต์, สี, ความสม่ำเสมอของภาพ)

ตอบเป็น JSON เท่านั้น เช่น:
{"amount": 1500, "date": "2026-03-14", "sending_bank": "กสิกรไทย", "receiving_bank": "กรุงไทย", "receiving_account_number": "1234567890", "transaction_ref": "20260314ABC123", "is_authentic": true}

ถ้าไม่สามารถอ่านข้อมูลสลิปได้ ให้ตอบ: {"error": "unreadable"}`;

  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image,
      },
    },
  ]);

  const responseText = result.response.text().trim();

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.error === 'unreadable') return null;

    return {
      amount: Number(parsed.amount),
      date: String(parsed.date),
      sending_bank: String(parsed.sending_bank),
      receiving_bank: String(parsed.receiving_bank),
      receiving_account_number: String(parsed.receiving_account_number),
      transaction_ref: String(parsed.transaction_ref),
      is_authentic: Boolean(parsed.is_authentic),
    };
  } catch {
    return null;
  }
}

export async function verifySlip(
  slipData: SlipData,
  settings: VillageSettings,
): Promise<VerificationResult> {
  // Check authenticity
  if (!slipData.is_authentic) {
    return {
      valid: false,
      slip_data: slipData,
      error_message: 'สลิปมีความผิดปกติ กรุณาติดต่อกรรมการหมู่บ้าน',
      monthCount: 0,
    };
  }

  // Check amount is a positive multiple of monthly fee
  const monthlyFee = settings.monthly_fee_amount;
  if (slipData.amount <= 0 || slipData.amount % monthlyFee !== 0) {
    return {
      valid: false,
      slip_data: slipData,
      error_message: `จำนวนเงินไม่ตรงกับค่าส่วนกลาง (ค่าส่วนกลางเดือนละ ${monthlyFee} บาท, ยอดที่โอน: ${slipData.amount} บาท)`,
      monthCount: 0,
    };
  }

  const monthCount = slipData.amount / monthlyFee;
  if (monthCount > 12) {
    return {
      valid: false,
      slip_data: slipData,
      error_message: 'จำนวนเงินมากเกินไป กรุณาติดต่อกรรมการหมู่บ้าน',
      monthCount: 0,
    };
  }

  // Check recipient account
  if (
    slipData.receiving_account_number &&
    !slipData.receiving_account_number.includes(settings.bank_account_number)
  ) {
    return {
      valid: false,
      slip_data: slipData,
      error_message: `บัญชีปลายทางไม่ถูกต้อง กรุณาโอนเงินไปยังบัญชี ${settings.bank_name} ${settings.bank_account_number}`,
      monthCount: 0,
    };
  }

  // Check duplicate
  const existing = await findPaymentByTransactionRef(slipData.transaction_ref);
  if (existing) {
    return {
      valid: false,
      slip_data: slipData,
      error_message: `สลิปนี้เคยถูกบันทึกแล้ว (ref: ${slipData.transaction_ref})`,
      monthCount: 0,
    };
  }

  return {
    valid: true,
    slip_data: slipData,
    error_message: null,
    monthCount,
  };
}
