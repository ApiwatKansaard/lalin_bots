## 1. Project Setup

- [x] 1.1 Initialize Node.js project with TypeScript (package.json, tsconfig.json)
- [x] 1.2 Install dependencies: express, @line/bot-sdk, googleapis, @google/generative-ai, dotenv
- [x] 1.3 Create project directory structure (src/, src/line/, src/services/, src/types/)
- [x] 1.4 Create .env.example with all required environment variables
- [x] 1.5 Create .gitignore (node_modules, dist, .env)

## 2. Configuration & Server Bootstrap

- [x] 2.1 Implement src/config.ts — load and validate environment variables (LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN, GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GEMINI_API_KEY, PORT)
- [x] 2.2 Implement src/index.ts — Express server with /health endpoint and LINE webhook middleware
- [x] 2.3 Initialize LINE Messaging API client in src/line/webhook.ts
- [x] 2.4 Initialize Google Sheets client in src/services/sheets.ts with service account auth

## 3. TypeScript Types

- [x] 3.1 Define types in src/types/index.ts — PaymentRecord, HouseRecord, VillageSettings, SlipData, VerificationResult

## 4. Google Sheets Integration

- [x] 4.1 Implement sheets.ts: getSettings() — read village settings (monthly_fee, bank account, village name)
- [x] 4.2 Implement sheets.ts: findHouseByLineUserId(lineUserId) — look up house data from houses sheet
- [x] 4.3 Implement sheets.ts: addPaymentRecord(record) — append row to payments sheet
- [x] 4.4 Implement sheets.ts: findPaymentByTransactionRef(ref) — check for duplicate transaction reference
- [x] 4.5 Implement sheets.ts: getPaymentHistory(houseNumber) — retrieve payment records for a house
- [x] 4.6 Implement sheets.ts: getOutstandingBalance(houseNumber, moveInDate) — calculate unpaid months

## 5. Slip Verification Service

- [x] 5.1 Implement src/services/slip-verification.ts: extractSlipData(imageBuffer) — send image to Gemini Vision and extract amount, date, bank, transaction ref
- [x] 5.2 Implement slip-verification.ts: verifySlip(slipData, settings) — validate amount, recipient account, authenticity
- [x] 5.3 Implement duplicate detection: check transaction ref against existing records before recording

## 6. LINE Webhook Handler

- [x] 6.1 Implement src/line/webhook.ts: handleWebhook(events) — route events by type (message/image vs message/text)
- [x] 6.2 Implement image message handler — download image via LINE Content API, run verification pipeline, record payment or reply with error
- [x] 6.3 Implement text message handler — keyword matching for "สถานะ", "จ่ายแล้วยัง", "เช็คยอด", "ส่งสลิป", "ยอดค้าง", "ประวัติ"
- [x] 6.4 Implement unknown user handler — reply asking to contact committee for registration

## 7. LINE Messages & Flex Message Templates

- [x] 7.1 Implement src/line/messages.ts: buildPaymentConfirmation(payment) — Flex Message card with payment summary and ✅ badge
- [x] 7.2 Implement messages.ts: buildOutstandingBalance(balance, unpaidMonths) — Flex Message with outstanding details
- [x] 7.3 Implement messages.ts: buildPaymentHistory(payments) — Flex Message carousel of recent payments
- [x] 7.4 Implement messages.ts: buildHelpMessage() — list available commands
- [x] 7.5 Implement messages.ts: buildErrorMessage(reason) — error reply messages

## 8. Rich Menu Setup

- [x] 8.1 Create Rich Menu image asset (3-panel layout: ส่งสลิป, เช็คยอดค้าง, ประวัติการจ่าย)
- [x] 8.2 Implement src/line/richmenu.ts: setupRichMenu() — create and link Rich Menu via LINE API on startup

## 9. End-to-End Integration

- [x] 9.1 Wire up the full flow: webhook → user lookup → image download → slip verification → payment recording → Flex Message reply
- [x] 9.2 Implement async processing pattern — respond 200 immediately, use push message API for results
- [x] 9.3 Add error handling for each external API call (LINE, Google Sheets, Gemini)

## 10. Deployment & Configuration

- [x] 10.1 Create Dockerfile or Procfile for Railway/Render deployment
- [x] 10.2 Document deployment steps and environment variable setup in README.md
- [ ] 10.3 Configure LINE webhook URL to point to deployed server
