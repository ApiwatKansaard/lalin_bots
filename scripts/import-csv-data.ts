/**
 * Import CSV data into Google Sheets: house data (monthly_rate, dates, arrears)
 * and payment records with discount calculation.
 *
 * CSV columns:
 *   0: ผัง (house number, without "29/" prefix)
 *   1: ชื่อ-นามสกุล (resident name)
 *   2: วันที่โอน (transfer_date, DD/MM/YYYY)
 *   3: วันที่ครบกำหนด (due_date, DD/MM/YYYY)
 *   4: บาท/ตร.ว/เดือน (monthly_rate)
 *   7: ยอดค้างชำระทั้งหมด (prior_arrears)
 *   8: ชำระหนี้ค้าง (prior_arrears_paid, col labeled จำนวนเงิน under ชำระหนี้ค้าง)
 *   9–20: Monthly payments ม.ค.–ธ.ค. 2568
 *   25: ส่วนลด (total discount)
 *
 * Usage: npx ts-node scripts/import-csv-data.ts <csv-file-path>
 */
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
  key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

// Simple CSV parser (handles quoted fields)
function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (inQuotes) {
      if (ch === '"' && content[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current.trim());
        current = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && content[i + 1] === '\n') i++;
        row.push(current.trim());
        if (row.some((c) => c !== '')) rows.push(row);
        row = [];
        current = '';
      } else {
        current += ch;
      }
    }
  }
  row.push(current.trim());
  if (row.some((c) => c !== '')) rows.push(row);
  return rows;
}

interface CSVHouse {
  houseNumber: string;
  residentName: string;
  transferDate: string;
  dueDate: string;
  monthlyRate: number;
  priorArrears: number;
  priorArrearsPaid: number;
  monthlyPayments: { month: number; amount: number }[];
  totalDiscount: number;
}

function parseCSVData(rows: string[][]): CSVHouse[] {
  const houses: CSVHouse[] = [];
  // Data starts at row 2 (index 2), skip header rows 0 and 1
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const houseNum = row[0] || '';
    if (!houseNum || isNaN(parseInt(houseNum))) continue;

    const monthlyRate = parseFloat(row[4]) || 0;
    const priorArrears = parseFloat(row[7]) || 0;
    const priorArrearsPaid = parseFloat(row[8]) || 0;
    const totalDiscount = parseFloat(row[25]) || 0;

    // Monthly payments: cols 9–20 = ม.ค.–ธ.ค.
    const monthlyPayments: { month: number; amount: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const val = parseFloat(row[9 + m]);
      if (!isNaN(val) && val > 0) {
        monthlyPayments.push({ month: m + 1, amount: val });
      }
    }

    houses.push({
      houseNumber: `29/${houseNum}`,
      residentName: row[1] || '',
      transferDate: row[2] || '',
      dueDate: row[3] || '',
      monthlyRate,
      priorArrears,
      priorArrearsPaid,
      monthlyPayments,
      totalDiscount,
    });
  }
  return houses;
}

async function run() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('Usage: npx ts-node scripts/import-csv-data.ts <csv-file-path>');
    process.exit(1);
  }

  const resolvedPath = path.resolve(csvPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(resolvedPath, 'utf-8');
  const rows = parseCSV(content);
  const csvHouses = parseCSVData(rows);
  console.log(`Parsed ${csvHouses.length} houses from CSV`);

  // Read existing houses
  const housesRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'houses!A2:K',
  });
  const existingRows = housesRes.data.values || [];
  const existingMap = new Map<string, number>();
  existingRows.forEach((row, i) => {
    existingMap.set(row[0] || '', i + 2); // rowIndex in sheet
  });

  // Read existing payments for idempotency check
  const paymentsRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'payments!A2:K',
  });
  const existingPayments = paymentsRes.data.values || [];
  const paymentKeys = new Set<string>();
  existingPayments.forEach((row) => {
    const key = `${row[0]}|${row[2]}|${row[3]}|${row[9]}`; // house_number|month|year|recorded_by
    paymentKeys.add(key);
  });

  console.log(`\nExisting houses: ${existingMap.size}`);
  console.log(`Existing payments: ${existingPayments.length}`);

  // Import houses — batch update existing, batch append new
  console.log('\n=== Importing house data ===');
  const updateData: { range: string; values: string[][] }[] = [];
  const newHouseRows: string[][] = [];

  for (const h of csvHouses) {
    const rowIdx = existingMap.get(h.houseNumber);
    if (rowIdx) {
      updateData.push({
        range: `houses!G${rowIdx}:K${rowIdx}`,
        values: [[
          h.monthlyRate.toString(),
          h.transferDate,
          h.dueDate,
          h.priorArrears.toString(),
          h.priorArrearsPaid.toString(),
        ]],
      });
    } else {
      newHouseRows.push([
        h.houseNumber,
        h.residentName,
        '', // line_user_id
        '', // phone
        h.transferDate, // move_in_date = transfer_date
        'TRUE', // is_active
        h.monthlyRate.toString(),
        h.transferDate,
        h.dueDate,
        h.priorArrears.toString(),
        h.priorArrearsPaid.toString(),
      ]);
    }
  }

  if (updateData.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updateData,
      },
    });
  }
  if (newHouseRows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'houses!A:K',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: newHouseRows },
    });
  }
  console.log(`  Updated: ${updateData.length}, Inserted: ${newHouseRows.length}`);

  // Import payments — collect all rows then append in one call
  console.log('\n=== Importing payment records ===');
  let skipped = 0;
  const paymentYear = '2568';
  const paymentRows: string[][] = [];

  for (const h of csvHouses) {
    for (const mp of h.monthlyPayments) {
      const key = `${h.houseNumber}|${mp.month}|${paymentYear}|csv-import`;
      if (paymentKeys.has(key)) {
        skipped++;
        continue;
      }

      // Calculate per-payment discount
      const discount = h.monthlyRate > 0 && mp.amount < h.monthlyRate
        ? (h.monthlyRate - mp.amount).toFixed(2)
        : '0';

      paymentRows.push([
        h.houseNumber,
        h.residentName,
        mp.month.toString(),
        paymentYear,
        mp.amount.toString(),
        paymentYear, // paid_date (just year)
        'CSV-IMPORT',
        '', // slip_image_url
        'verified',
        'csv-import',
        discount,
      ]);
    }
  }

  if (paymentRows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'payments!A:K',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: paymentRows },
    });
  }
  console.log(`  Imported: ${paymentRows.length}, Skipped (duplicate): ${skipped}`);

  console.log('\n=== Import complete ===');
}

run().catch((e) => {
  console.error('Import failed:', e.message);
  process.exit(1);
});
