## Why

Our village committee currently collects monthly common area fees (ค่าส่วนกลาง) manually — residents transfer money and send slip photos via LINE group chat, then committee members manually check and log payments in spreadsheets. This process is error-prone, slow, and lacks duplicate detection or slip verification. A LINE chatbot will automate slip verification, payment recording, and status checking, reducing committee workload and giving residents instant feedback.

## What Changes

- Build a new LINE chatbot backend (Node.js + TypeScript + Express) that receives webhook events from LINE
- Integrate Claude AI Vision API to extract and verify payment slip data (amount, date, bank, transaction reference)
- Automate payment recording to Google Sheets (payments, houses, settings)
- Provide Rich Menu with quick actions: "ส่งสลิป", "เช็คยอดค้าง", "ประวัติการจ่าย"
- Reply with LINE Flex Messages for payment confirmations and status summaries
- Detect duplicate slips by transaction reference number
- Validate slip authenticity (correct amount, correct recipient bank account)

## Capabilities

### New Capabilities

- `line-webhook`: LINE Messaging API webhook handler — receives messages (text + image), routes to appropriate handlers, manages reply tokens
- `slip-verification`: Claude Vision AI integration — extracts slip data (amount, date, bank, ref), validates amount against settings, detects duplicates, checks recipient account
- `payment-recording`: Google Sheets integration — reads/writes payment records, house data, and village settings; manages payment lifecycle
- `resident-interaction`: Rich Menu config, Flex Message templates, payment status queries, payment history display
- `app-config`: Application configuration, environment setup, Express server bootstrap, LINE SDK initialization

### Modified Capabilities

_(none — greenfield project)_

## Impact

- **New codebase**: Entire Node.js + TypeScript project created from scratch
- **External APIs**: LINE Messaging API, Google Sheets API, Claude AI (Anthropic) API
- **Infrastructure**: Requires deployment to Railway or Render with HTTPS endpoint for LINE webhook
- **Data**: Google Sheet serves as database — 3 sheets (payments, houses, settings)
- **Secrets**: LINE Channel Secret, Channel Access Token, Google Service Account credentials, Anthropic API key
