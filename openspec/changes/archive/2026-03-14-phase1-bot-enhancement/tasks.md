## 1. Types & Sheets Service

- [x] 1.1 Add `RegistrationState` type to `src/types/index.ts` with `step` and `timestamp` fields
- [x] 1.2 Add `findHouseByNumber(houseNumber: string)` function to `src/services/sheets.ts` — search houses sheet by column A
- [x] 1.3 Add `updateHouseLineUserId(houseNumber: string, lineUserId: string)` function to `src/services/sheets.ts` — write to column C for matching row
- [x] 1.4 Add `findPaymentByHouseMonthYear(houseNumber: string, month: string, year: string)` function to `src/services/sheets.ts` — check duplicate payment for same month
- [x] 1.5 Add `getUnpaidMonths(houseNumber: string, moveInDate: string, monthlyFee: number)` helper to `src/services/sheets.ts` — return ordered list of unpaid month/year pairs

## 2. Rich Menu Segmented Setup

- [x] 2.1 Rewrite `src/line/richmenu.ts` — delete all existing Rich Menus on startup via `getRichMenuList()` + `deleteRichMenu()`
- [x] 2.2 Create unregistered Rich Menu (2500×843, single button: "ลงทะเบียน") and set as default
- [x] 2.3 Create registered Rich Menu (2500×1686, 2×2 grid: ส่งสลิป / เช็คยอดค้าง / ประวัติการจ่าย / วิธีใช้งาน)
- [x] 2.4 Export `getRegisteredMenuId()` function so webhook can call `linkRichMenuToUser()` after registration
- [x] 2.5 Add "วิธีใช้งาน" text match in webhook `handleTextMessage()` to route to `buildHelpMessage()`

## 3. Rich Menu Image Processing

- [x] 3.1 Resize `Gemini_Generated_Image_hluv60hluv60hluv.png` (3552×1184) → `assets/richmenu-unregistered.png` (2500×843) using `sips`
- [x] 3.2 Resize `Gemini_Generated_Image_3p57i33p57i33p57.png` (2528×1696) → `assets/richmenu-registered.png` (2500×1686) using `sips`
- [x] 3.3 Compress both images to under 1MB — convert to JPEG at quality 85% if PNG exceeds limit
- [x] 3.4 Verify final images: correct dimensions, under 1MB, visually intact
- [x] 3.5 Remove original `Gemini_Generated_Image_*.png` files from assets

## 4. Message Templates

- [x] 4.1 Add `buildWelcomeMessage()` to `src/line/messages.ts` — greeting + instruction to register
- [x] 4.2 Add `buildRegistrationPrompt()` — "กรุณาพิมพ์เลขบ้านของคุณ"
- [x] 4.3 Add `buildRegistrationSuccess(houseNumber, residentName)` — confirmation Flex message
- [x] 4.4 Add `buildRegistrationError(reason)` — error message for registration failures
- [x] 4.5 Add `buildUnsupportedMessageType()` — "ระบบรองรับเฉพาะข้อความและรูปสลิป"
- [x] 4.6 Add `buildMultiMonthConfirmation(payments, settings)` — confirmation for multi-month payment

## 5. Webhook Enhancement — Event Handling

- [x] 5.1 Add follow event handler in `src/line/webhook.ts` — send welcome message
- [x] 5.2 Add unfollow event handler — log user ID
- [x] 5.3 Add unsupported message type handler — respond to sticker/video/audio/file/location with friendly message

## 6. User Registration Flow

- [x] 6.1 Add in-memory registration state map (`Map<userId, {step, timestamp}>`) with 15-minute TTL cleanup in `src/line/webhook.ts`
- [x] 6.2 Add `handleRegistration(userId, text)` function — process "ลงทะเบียน" command and house number input
- [x] 6.3 Handle "ยกเลิก" to cancel registration
- [x] 6.4 Integrate registration check at top of `handleTextMessage()` — if user in registration state, route to registration handler
- [x] 6.5 Allow unregistered users to send "ลงทะเบียน" without hitting the "ไม่พบข้อมูลบ้าน" dead-end

## 7. Payment Logic Fixes

- [x] 7.1 Modify `verifySlip()` in `src/services/slip-verification.ts` — accept amount as multiple of monthly_fee (1× to 12×), return `monthCount`
- [x] 7.2 Add `monthCount` field to `VerificationResult` type in `src/types/index.ts`
- [x] 7.3 Modify `handleImageMessage()` in `src/line/webhook.ts` — use `getUnpaidMonths()` to assign payments to earliest unpaid months instead of current date
- [x] 7.4 Support recording multiple payment rows for multi-month payments
- [x] 7.5 Add duplicate month detection — check if payment already exists for target month before recording

## 8. Integration & Testing

- [x] 8.1 Update `src/index.ts` if any startup changes needed (Rich Menu setup is already called)
- [x] 8.2 Build and verify no TypeScript compilation errors
- [x] 8.3 Test registration flow end-to-end: follow → register → enter house number → menu switch
- [x] 8.4 Test payment flow: send slip → verify multi-month → record → confirm
- [x] 8.5 Test edge cases: duplicate registration, inactive house, expired registration state, duplicate payment month
