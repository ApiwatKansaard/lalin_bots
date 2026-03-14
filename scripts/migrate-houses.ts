/**
 * Migration script: Add columns G–K to houses sheet, prefix house numbers with "29/",
 * and update settings sheet to remove monthly_fee_amount.
 *
 * Usage: npx ts-node scripts/migrate-houses.ts
 */
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
dotenv.config();

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
  key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

async function run() {
  console.log('=== Starting migration ===');

  // 1. Add headers G–K to houses sheet
  console.log('\n1. Adding new column headers to houses sheet...');
  const headersRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'houses!A1:K1',
  });
  const existingHeaders = headersRes.data.values?.[0] || [];
  if (existingHeaders.length <= 6) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'houses!G1:K1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['monthly_rate', 'transfer_date', 'due_date', 'prior_arrears', 'prior_arrears_paid']],
      },
    });
    console.log('  ✅ Headers G–K added');
  } else {
    console.log('  ⏭️  Headers already exist, skipping');
  }

  // 2. Prefix house numbers with "29/"
  console.log('\n2. Prefixing house numbers with "29/"...');
  const housesRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'houses!A2:A',
  });
  const houseNumbers = housesRes.data.values || [];
  const housePrefixData: { range: string; values: string[][] }[] = [];
  for (let i = 0; i < houseNumbers.length; i++) {
    const num = houseNumbers[i][0] || '';
    if (num && !num.startsWith('29/')) {
      housePrefixData.push({
        range: `houses!A${i + 2}`,
        values: [[`29/${num}`]],
      });
    }
  }
  if (housePrefixData.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: housePrefixData,
      },
    });
  }
  console.log(`  ✅ Prefixed ${housePrefixData.length} house numbers`);

  // 3. Update payments sheet headers (add discount column K)
  console.log('\n3. Updating payments sheet headers...');
  const paymentHeadersRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'payments!A1:K1',
  });
  const paymentHeaders = paymentHeadersRes.data.values?.[0] || [];
  if (paymentHeaders.length <= 10) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'payments!K1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['discount']] },
    });
    console.log('  ✅ Added discount column header');
  } else {
    console.log('  ⏭️  Discount header already exists, skipping');
  }

  // 4. Prefix house numbers in payments sheet
  console.log('\n4. Prefixing house numbers in payments sheet...');
  const paymentsRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'payments!A2:A',
  });
  const paymentHouseNums = paymentsRes.data.values || [];
  const payPrefixData: { range: string; values: string[][] }[] = [];
  for (let i = 0; i < paymentHouseNums.length; i++) {
    const num = paymentHouseNums[i][0] || '';
    if (num && !num.startsWith('29/')) {
      payPrefixData.push({
        range: `payments!A${i + 2}`,
        values: [[`29/${num}`]],
      });
    }
  }
  if (payPrefixData.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: payPrefixData,
      },
    });
  }
  console.log(`  ✅ Prefixed ${payPrefixData.length} payment house numbers`);

  // 5. Update settings sheet — remove monthly_fee_amount, shift to A:C
  console.log('\n5. Updating settings sheet...');
  const settingsRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'settings!A2:D2',
  });
  const settingsRow = settingsRes.data.values?.[0] || [];
  // Old format: [monthly_fee_amount, bank_account_number, bank_name, village_name]
  // New format: [bank_account_number, bank_name, village_name]
  const bankAccountNumber = settingsRow[1] || '';
  const bankName = settingsRow[2] || '';
  const villageName = settingsRow[3] || '';

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'settings!A1:C2',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['bank_account_number', 'bank_name', 'village_name'],
        [bankAccountNumber, bankName, villageName],
      ],
    },
  });
  // Clear old column D
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'settings!D1:D2',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[''], ['']] },
  });
  console.log('  ✅ Settings updated to 3-column format');

  console.log('\n=== Migration complete ===');
}

run().catch((e) => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
