import { FlexMessage, FlexBubble, FlexCarousel, TextMessage } from '@line/bot-sdk';
import { HouseRecord, PaymentRecord, VillageSettings } from '../types';

export function buildPaymentConfirmation(
  payment: PaymentRecord,
  settings: VillageSettings,
): FlexMessage {
  const bubble: FlexBubble = {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `🏘️ ${settings.village_name}`,
          weight: 'bold',
          size: 'lg',
          color: '#1DB446',
        },
        {
          type: 'text',
          text: 'ยืนยันการชำระค่าส่วนกลาง',
          size: 'sm',
          color: '#aaaaaa',
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'บ้านเลขที่', size: 'sm', color: '#555555', flex: 0 },
            { type: 'text', text: payment.house_number, size: 'sm', color: '#111111', align: 'end' },
          ],
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'ชื่อ', size: 'sm', color: '#555555', flex: 0 },
            { type: 'text', text: payment.resident_name, size: 'sm', color: '#111111', align: 'end' },
          ],
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'จำนวนเงิน', size: 'sm', color: '#555555', flex: 0 },
            { type: 'text', text: `${payment.amount} บาท`, size: 'sm', color: '#111111', align: 'end' },
          ],
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'วันที่จ่าย', size: 'sm', color: '#555555', flex: 0 },
            { type: 'text', text: payment.paid_date, size: 'sm', color: '#111111', align: 'end' },
          ],
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'ประจำเดือน', size: 'sm', color: '#555555', flex: 0 },
            { type: 'text', text: `${payment.month}/${payment.year}`, size: 'sm', color: '#111111', align: 'end' },
          ],
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'Ref', size: 'sm', color: '#555555', flex: 0 },
            { type: 'text', text: payment.transaction_ref, size: 'sm', color: '#111111', align: 'end' },
          ],
        },
        { type: 'separator', margin: 'lg' },
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'lg',
          contents: [
            { type: 'text', text: 'สถานะ', size: 'md', weight: 'bold', color: '#555555', flex: 0 },
            { type: 'text', text: '✅ ชำระแล้ว', size: 'md', weight: 'bold', color: '#1DB446', align: 'end' },
          ],
        },
      ],
    },
  };

  return {
    type: 'flex',
    altText: `ยืนยันการชำระค่าส่วนกลาง บ้านเลขที่ ${payment.house_number}`,
    contents: bubble,
  };
}

export function buildOutstandingBalance(
  villageName: string,
  houseNumber: string,
  totalOwed: number,
  unpaidMonths: string[],
  monthlyFee: number,
  priorArrearsRemaining?: number,
): FlexMessage | TextMessage {
  if (unpaidMonths.length === 0 && (!priorArrearsRemaining || priorArrearsRemaining <= 0)) {
    return {
      type: 'text',
      text: 'คุณไม่มียอดค้างชำระ ✅',
    };
  }

  const monthItems = unpaidMonths.map((m) => ({
    type: 'box' as const,
    layout: 'horizontal' as const,
    contents: [
      { type: 'text' as const, text: m, size: 'sm' as const, color: '#555555' },
      { type: 'text' as const, text: `${monthlyFee} บาท`, size: 'sm' as const, color: '#DD0000', align: 'end' as const },
    ],
  }));

  const bodyContents: any[] = [...monthItems];

  if (priorArrearsRemaining && priorArrearsRemaining > 0) {
    bodyContents.push(
      { type: 'separator', margin: 'md' },
      {
        type: 'box',
        layout: 'horizontal',
        contents: [
          { type: 'text', text: 'ค้างจ่ายปีก่อน', size: 'sm', color: '#555555' },
          { type: 'text', text: `${priorArrearsRemaining} บาท`, size: 'sm', color: '#DD0000', align: 'end' },
        ],
      },
    );
  }

  bodyContents.push(
    { type: 'separator', margin: 'lg' },
    {
      type: 'box',
      layout: 'horizontal',
      margin: 'lg',
      contents: [
        { type: 'text', text: 'รวม', size: 'md', weight: 'bold', color: '#555555', flex: 0 },
        { type: 'text', text: `${totalOwed} บาท`, size: 'md', weight: 'bold', color: '#DD0000', align: 'end' },
      ],
    },
  );

  const bubble: FlexBubble = {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: `🏘️ ${villageName}`, weight: 'bold', size: 'lg', color: '#DD0000' },
        { type: 'text', text: `บ้านเลขที่ ${houseNumber} — ยอดค้างชำระ (เดือนละ ${monthlyFee} บาท)`, size: 'sm', color: '#aaaaaa' },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: bodyContents,
    },
  };

  return {
    type: 'flex',
    altText: `ยอดค้างชำระ ${totalOwed} บาท (${unpaidMonths.length} เดือน)`,
    contents: bubble,
  };
}

export function buildPaymentHistory(
  payments: PaymentRecord[],
  villageName: string,
): FlexMessage | TextMessage {
  if (payments.length === 0) {
    return { type: 'text', text: 'ยังไม่มีประวัติการชำระเงิน' };
  }

  const recent = payments.slice(0, 10);

  const bubbles = recent.map((p) => ({
    type: 'bubble' as const,
    body: {
      type: 'box' as const,
      layout: 'vertical' as const,
      contents: [
        { type: 'text', text: `${villageName}`, weight: 'bold', size: 'sm', color: '#1DB446' },
        { type: 'text', text: `ประจำเดือน ${p.month}/${p.year}`, weight: 'bold', size: 'lg' },
        { type: 'separator', margin: 'md' },
        {
          type: 'box', layout: 'vertical', margin: 'md', contents: [
            {
              type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: 'จำนวนเงิน', size: 'sm', color: '#555555', flex: 0 },
                { type: 'text', text: `${p.amount} บาท`, size: 'sm', align: 'end' },
              ],
            },
            {
              type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: 'วันที่จ่าย', size: 'sm', color: '#555555', flex: 0 },
                { type: 'text', text: p.paid_date, size: 'sm', align: 'end' },
              ],
            },
            {
              type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: 'สถานะ', size: 'sm', color: '#555555', flex: 0 },
                { type: 'text', text: p.verified_status === 'verified' ? '✅' : '⏳', size: 'sm', align: 'end' },
              ],
            },
          ],
        },
      ],
    },
  } as FlexBubble));

  const carousel: FlexCarousel = {
    type: 'carousel',
    contents: bubbles,
  };

  return {
    type: 'flex',
    altText: `ประวัติการชำระเงิน ${recent.length} รายการ`,
    contents: carousel,
  };
}

export function buildHelpMessage(house?: HouseRecord): TextMessage {
  let text = `📋 คำสั่งที่ใช้ได้:
• ส่งรูปสลิป — บันทึกการชำระค่าส่วนกลาง
• พิมพ์ "เช็คยอด" — ตรวจสอบยอดค้างชำระ
• พิมพ์ "ประวัติ" — ดูประวัติการชำระเงิน
• พิมพ์ "สถานะ" — เช็คสถานะเดือนปัจจุบัน

หรือกดเมนูด้านล่างเพื่อเลือกคำสั่ง`;

  if (house) {
    const rate = parseFloat(house.monthly_rate) || 0;
    text += `\n\nค่าส่วนกลางบ้านเลขที่ ${house.house_number}: ${rate} บาท/เดือน`;
  }

  return { type: 'text', text };
}

export function buildErrorMessage(reason: string): TextMessage {
  return {
    type: 'text',
    text: `❌ ${reason}`,
  };
}

export function buildWelcomeMessage(): TextMessage {
  return {
    type: 'text',
    text: `🏘️ สวัสดีค่ะ ยินดีต้อนรับสู่ระบบค่าส่วนกลางหมู่บ้าน

กรุณากดปุ่ม "ลงทะเบียนบ้าน" ด้านล่างเพื่อเริ่มต้นใช้งานค่ะ`,
  };
}

export function buildRegistrationPrompt(): TextMessage {
  return {
    type: 'text',
    text: `📝 กรุณาพิมพ์เลขบ้านของคุณ (เช่น 8 หรือ 29/8)

หรือพิมพ์ "ยกเลิก" เพื่อยกเลิกการลงทะเบียน`,
  };
}

export function buildRegistrationSuccess(houseNumber: string, residentName: string): FlexMessage {
  const bubble: FlexBubble = {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: '✅ ลงทะเบียนสำเร็จ', weight: 'bold', size: 'lg', color: '#1DB446' },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'บ้านเลขที่', size: 'sm', color: '#555555', flex: 0 },
            { type: 'text', text: houseNumber, size: 'sm', color: '#111111', align: 'end' },
          ],
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'ชื่อ', size: 'sm', color: '#555555', flex: 0 },
            { type: 'text', text: residentName, size: 'sm', color: '#111111', align: 'end' },
          ],
        },
        { type: 'separator', margin: 'lg' },
        {
          type: 'text',
          text: 'คุณสามารถใช้เมนูด้านล่างเพื่อส่งสลิป เช็คยอด หรือดูประวัติได้เลยค่ะ',
          size: 'sm',
          color: '#888888',
          margin: 'lg',
          wrap: true,
        },
      ],
    },
  };

  return {
    type: 'flex',
    altText: `ลงทะเบียนสำเร็จ บ้านเลขที่ ${houseNumber}`,
    contents: bubble,
  };
}

export function buildRegistrationError(reason: string): TextMessage {
  return {
    type: 'text',
    text: `❌ ${reason}`,
  };
}

export function buildUnsupportedMessageType(): TextMessage {
  return {
    type: 'text',
    text: 'ขออภัยค่ะ ระบบรองรับเฉพาะข้อความและรูปสลิปเท่านั้น',
  };
}

export function buildMultiMonthConfirmation(
  payments: PaymentRecord[],
  settings: VillageSettings,
): FlexMessage {
  const monthItems = payments.map((p) => ({
    type: 'box' as const,
    layout: 'horizontal' as const,
    contents: [
      { type: 'text' as const, text: `${p.month}/${p.year}`, size: 'sm' as const, color: '#555555' },
      { type: 'text' as const, text: `${p.amount} บาท`, size: 'sm' as const, color: '#1DB446', align: 'end' as const },
    ],
  }));

  const bubble: FlexBubble = {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: `🏘️ ${settings.village_name}`, weight: 'bold', size: 'lg', color: '#1DB446' },
        { type: 'text', text: `ยืนยันการชำระค่าส่วนกลาง ${payments.length} เดือน`, size: 'sm', color: '#aaaaaa' },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'บ้านเลขที่', size: 'sm', color: '#555555', flex: 0 },
            { type: 'text', text: payments[0].house_number, size: 'sm', color: '#111111', align: 'end' },
          ],
        },
        { type: 'separator', margin: 'md' },
        ...monthItems,
        { type: 'separator', margin: 'lg' },
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'lg',
          contents: [
            { type: 'text', text: 'สถานะ', size: 'md', weight: 'bold', color: '#555555', flex: 0 },
            { type: 'text', text: '✅ ชำระแล้ว', size: 'md', weight: 'bold', color: '#1DB446', align: 'end' },
          ],
        },
      ],
    },
  };

  return {
    type: 'flex',
    altText: `ยืนยันการชำระค่าส่วนกลาง ${payments.length} เดือน บ้านเลขที่ ${payments[0].house_number}`,
    contents: bubble,
  };
}
