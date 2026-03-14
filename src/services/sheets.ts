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
    range: 'settings!A2:C2',
  });
  const row = res.data.values?.[0];
  if (!row) throw new Error('Settings not found in Google Sheet');
  return {
    bank_account_number: row[0],
    bank_name: row[1],
    village_name: row[2],
  };
}

export async function findHouseByLineUserId(lineUserId: string): Promise<HouseRecord | null> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'houses!A2:K',
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
    monthly_rate: row[6] || '0',
    transfer_date: row[7] || '',
    due_date: row[8] || '',
    prior_arrears: row[9] || '0',
    prior_arrears_paid: row[10] || '0',
  };
}

export async function addPaymentRecord(record: PaymentRecord): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'payments!A:K',
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
        record.discount,
      ]],
    },
  });
}

export async function findPaymentByTransactionRef(ref: string): Promise<PaymentRecord | null> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'payments!A2:K',
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
    discount: row[10] || '0',
  };
}

export async function getPaymentHistory(houseNumber: string): Promise<PaymentRecord[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'payments!A2:K',
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
      discount: row[10] || '0',
    }))
    .reverse();
}

export async function getOutstandingBalance(
  house: HouseRecord,
): Promise<{ totalOwed: number; unpaidMonths: string[]; priorArrearsRemaining: number }> {
  const monthlyRate = parseFloat(house.monthly_rate) || 0;
  const priorArrears = parseFloat(house.prior_arrears) || 0;
  const priorArrearsPaid = parseFloat(house.prior_arrears_paid) || 0;
  const priorArrearsRemaining = Math.max(0, priorArrears - priorArrearsPaid);

  const startDate = house.due_date || house.move_in_date;
  if (!startDate) return { totalOwed: priorArrearsRemaining, unpaidMonths: [], priorArrearsRemaining };

  const payments = await getPaymentHistory(house.house_number);
  const paidMonths = new Set(payments.map((p) => `${p.year}-${p.month}`));

  const start = parseDateString(startDate);
  const now = new Date();
  const unpaidMonths: string[] = [];

  // Start counting from the month AFTER due_date
  const cursor = new Date(start.getFullYear(), start.getMonth() + 1, 1);
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
    totalOwed: priorArrearsRemaining + unpaidMonths.length * monthlyRate,
    unpaidMonths,
    priorArrearsRemaining,
  };
}

function parseDateString(dateStr: string): Date {
  // Handle DD/MM/YYYY (Thai format from CSV)
  const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    return new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
  }
  // Fallback to standard Date parsing (YYYY-MM-DD etc.)
  return new Date(dateStr);
}

export async function findHouseByNumber(houseNumber: string): Promise<HouseRecord | null> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'houses!A2:K',
  });
  const rows = res.data.values;
  if (!rows) return null;

  const row = rows.find((r) => r[0] === houseNumber);
  if (!row) return null;

  return {
    house_number: row[0],
    resident_name: row[1],
    line_user_id: row[2] || '',
    phone: row[3] || '',
    move_in_date: row[4] || '',
    is_active: row[5] || 'TRUE',
    monthly_rate: row[6] || '0',
    transfer_date: row[7] || '',
    due_date: row[8] || '',
    prior_arrears: row[9] || '0',
    prior_arrears_paid: row[10] || '0',
  };
}

export async function updateHouseLineUserId(houseNumber: string, lineUserId: string): Promise<void> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'houses!A2:K',
  });
  const rows = res.data.values;
  if (!rows) throw new Error('Houses sheet is empty');

  const rowIndex = rows.findIndex((r) => r[0] === houseNumber);
  if (rowIndex === -1) throw new Error(`House ${houseNumber} not found`);

  // Row index + 2 (1-based + header row)
  const sheetRow = rowIndex + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `houses!C${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[lineUserId]],
    },
  });
}

export async function findPaymentByHouseMonthYear(
  houseNumber: string,
  month: string,
  year: string,
): Promise<PaymentRecord | null> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'payments!A2:K',
  });
  const rows = res.data.values;
  if (!rows) return null;

  const row = rows.find((r) => r[0] === houseNumber && r[2] === month && r[3] === year && r[8] === 'verified');
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
    discount: row[10] || '0',
  };
}

export async function getAllRegisteredLineUserIds(): Promise<string[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'houses!A2:K',
  });
  const rows = res.data.values;
  if (!rows) return [];

  return rows
    .filter((r) => r[2] && r[2].startsWith('U') && r[5] !== 'FALSE')
    .map((r) => r[2]);
}

export async function getUnpaidMonths(
  house: HouseRecord,
): Promise<{ month: string; year: string }[]> {
  const startDate = house.due_date || house.move_in_date;
  if (!startDate) return [];

  const payments = await getPaymentHistory(house.house_number);
  const paidMonths = new Set(payments.filter(p => p.verified_status === 'verified').map((p) => `${p.year}-${p.month}`));

  const start = parseDateString(startDate);
  const now = new Date();
  const unpaid: { month: string; year: string }[] = [];

  // Start counting from the month AFTER due_date
  const cursor = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  while (cursor <= now) {
    const y = cursor.getFullYear().toString();
    const m = (cursor.getMonth() + 1).toString();
    const key = `${y}-${m}`;
    if (!paidMonths.has(key)) {
      unpaid.push({ month: m, year: y });
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return unpaid;
}
