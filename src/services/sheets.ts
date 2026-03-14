import { google, sheets_v4 } from 'googleapis';
import { config } from '../config';
import { PaymentRecord, HouseRecord, VillageSettings } from '../types';

const auth = new google.auth.JWT({
  email: config.google.serviceAccountEmail,
  key: config.google.privateKey,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets: sheets_v4.Sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = config.google.sheetsId;

export async function getSettings(): Promise<VillageSettings> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'settings!A2:D2',
  });
  const row = res.data.values?.[0];
  if (!row) throw new Error('Settings not found in Google Sheet');
  return {
    monthly_fee_amount: parseFloat(row[0]),
    bank_account_number: row[1],
    bank_name: row[2],
    village_name: row[3],
  };
}

export async function findHouseByLineUserId(lineUserId: string): Promise<HouseRecord | null> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'houses!A2:F',
  });
  const rows = res.data.values;
  if (!rows) return null;

  const row = rows.find((r) => r[2] === lineUserId);
  if (!row) return null;

  return {
    house_number: row[0],
    resident_name: row[1],
    line_user_id: row[2],
    phone: row[3],
    move_in_date: row[4],
    is_active: row[5],
  };
}

export async function addPaymentRecord(record: PaymentRecord): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'payments!A:J',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        record.house_number,
        record.resident_name,
        record.month,
        record.year,
        record.amount,
        record.paid_date,
        record.transaction_ref,
        record.slip_image_url,
        record.verified_status,
        record.recorded_by,
      ]],
    },
  });
}

export async function findPaymentByTransactionRef(ref: string): Promise<PaymentRecord | null> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'payments!A2:J',
  });
  const rows = res.data.values;
  if (!rows) return null;

  const row = rows.find((r) => r[6] === ref);
  if (!row) return null;

  return {
    house_number: row[0],
    resident_name: row[1],
    month: row[2],
    year: row[3],
    amount: row[4],
    paid_date: row[5],
    transaction_ref: row[6],
    slip_image_url: row[7],
    verified_status: row[8],
    recorded_by: row[9],
  };
}

export async function getPaymentHistory(houseNumber: string): Promise<PaymentRecord[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'payments!A2:J',
  });
  const rows = res.data.values;
  if (!rows) return [];

  return rows
    .filter((r) => r[0] === houseNumber)
    .map((row) => ({
      house_number: row[0],
      resident_name: row[1],
      month: row[2],
      year: row[3],
      amount: row[4],
      paid_date: row[5],
      transaction_ref: row[6],
      slip_image_url: row[7],
      verified_status: row[8],
      recorded_by: row[9],
    }))
    .reverse();
}

export async function getOutstandingBalance(
  houseNumber: string,
  moveInDate: string,
  monthlyFee: number,
): Promise<{ totalOwed: number; unpaidMonths: string[] }> {
  const payments = await getPaymentHistory(houseNumber);
  const paidMonths = new Set(payments.map((p) => `${p.year}-${p.month}`));

  const start = new Date(moveInDate);
  const now = new Date();
  const unpaidMonths: string[] = [];

  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= now) {
    const y = cursor.getFullYear().toString();
    const m = (cursor.getMonth() + 1).toString();
    const key = `${y}-${m}`;
    if (!paidMonths.has(key)) {
      unpaidMonths.push(key);
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return {
    totalOwed: unpaidMonths.length * monthlyFee,
    unpaidMonths,
  };
}
