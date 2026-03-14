# Lalin Bots — Village Payment LINE Chatbot

LINE chatbot สำหรับจัดการค่าส่วนกลางหมู่บ้าน

## Tech Stack
- Node.js + TypeScript + Express
- LINE Messaging API
- Google Sheets API (data storage)
- Google Gemini Vision API (slip verification)

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env` and fill in values:
```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `LINE_CHANNEL_SECRET` | LINE Channel Secret |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Channel Access Token |
| `GEMINI_API_KEY` | Google Gemini API Key |
| `GOOGLE_SHEETS_ID` | Google Spreadsheet ID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google Service Account email |
| `GOOGLE_PRIVATE_KEY` | Google Service Account private key |
| `PORT` | Server port (default: 3000) |

### 3. Google Sheet Setup
Create a Google Sheet with 3 sheets:
- **payments**: `house_number, resident_name, month, year, amount, paid_date, transaction_ref, slip_image_url, verified_status, recorded_by`
- **houses**: `house_number, resident_name, line_user_id, phone, move_in_date, is_active`
- **settings**: `monthly_fee_amount, bank_account_number, bank_name, village_name`

Share the sheet with the service account email.

### 4. Build & Run
```bash
npm run build
npm start
```

### 5. Development
```bash
npm run dev
```

## Deployment (Railway / Render)
1. Push to GitHub
2. Connect repo to Railway or Render
3. Set environment variables in the dashboard
4. Set LINE webhook URL to `https://<your-domain>/webhook`

## Features
- 📸 ส่งสลิปโอนเงิน → AI ตรวจสอบอัตโนมัติ → บันทึกลง Google Sheet
- 💰 เช็คยอดค้างชำระ
- 📋 ดูประวัติการชำระเงิน
- 🔍 ตรวจจับสลิปซ้ำ (duplicate detection)
- ✅ Flex Message ยืนยันการชำระเงิน
