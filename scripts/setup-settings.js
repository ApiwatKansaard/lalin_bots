const { google } = require('googleapis');
require('dotenv').config();

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

async function run() {
  // Check existing sheets
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetNames = meta.data.sheets.map(s => s.properties.title);
  console.log('Existing sheets:', sheetNames);

  // Create settings sheet if not exists
  if (!sheetNames.includes('settings')) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: 'settings' } } }]
      }
    });
    console.log('Created settings sheet');
  }

  // Write headers + data
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'settings!A1:C2',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['bank_account_number', 'bank_name', 'village_name'],
        ['198-4-74759-0', 'ธนาคารกรุงเทพ', 'LALIN TOWN LIO ลำลูกกา คล']
      ]
    }
  });
  console.log('Settings data written successfully');

  // Create payments sheet if not exists
  if (!sheetNames.includes('payments')) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: 'payments' } } }]
      }
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'payments!A1:K1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['house_number', 'resident_name', 'month', 'year', 'amount', 'paid_date', 'transaction_ref', 'slip_image_url', 'verified_status', 'recorded_by', 'discount']]
      }
    });
    console.log('Created payments sheet with headers');
  }

  // Verify
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'settings!A1:C2',
  });
  console.log('Verified settings:', JSON.stringify(res.data.values, null, 2));
}

run().catch(e => console.error('Error:', e.message));
