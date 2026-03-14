## 1. Types & Interfaces

- [x] 1.1 Update `HouseRecord` in `src/types/index.ts` — add `monthly_rate: string`, `transfer_date: string`, `due_date: string`, `prior_arrears: string`, `prior_arrears_paid: string`
- [x] 1.2 Update `PaymentRecord` in `src/types/index.ts` — add `discount: string`
- [x] 1.3 Update `VillageSettings` in `src/types/index.ts` — remove `monthly_fee_amount` field
- [x] 1.4 Update `HouseRecord` in `dashboard/src/lib/sheets.ts` — add same 5 new fields
- [x] 1.5 Update `PaymentRecord` in `dashboard/src/lib/sheets.ts` — add `discount` field
- [x] 1.6 Update `VillageSettings` in `dashboard/src/lib/sheets.ts` — remove `monthly_fee_amount`

## 2. Bot Sheets Service

- [x] 2.1 Update `getSettings()` in `src/services/sheets.ts` — read `settings!A2:C2` (bank_account_number, bank_name, village_name), remove monthly_fee_amount
- [x] 2.2 Update `findHouseByLineUserId()` — read range `houses!A2:K`, map columns G–K to new fields
- [x] 2.3 Update `findHouseByNumber()` — read range `houses!A2:K`, map columns G–K to new fields
- [x] 2.4 Update `updateHouseLineUserId()` — read range `houses!A2:K` for row lookup
- [x] 2.5 Update `addPaymentRecord()` — write to `payments!A:K` including discount column
- [x] 2.6 Update `findPaymentByTransactionRef()` — read `payments!A2:K`, include discount field
- [x] 2.7 Update `getPaymentHistory()` — read `payments!A2:K`, include discount field in each record
- [x] 2.8 Update `findPaymentByHouseMonthYear()` — read `payments!A2:K`, include discount
- [x] 2.9 Rewrite `getOutstandingBalance()` — accept HouseRecord parameter, use `due_date` (fallback `move_in_date`), use `monthly_rate`, add `prior_arrears - prior_arrears_paid` to total
- [x] 2.10 Rewrite `getUnpaidMonths()` — use `due_date` (fallback `move_in_date`) instead of moveInDate parameter
- [x] 2.11 Update `getAllRegisteredLineUserIds()` — read range `houses!A2:K`

## 3. Slip Verification

- [x] 3.1 Update `verifySlip()` in `src/services/slip-verification.ts` — accept `monthlyRate: number` parameter instead of reading from settings
- [x] 3.2 Update amount validation messages — include house number and per-house rate in error text

## 4. Webhook & Messages

- [x] 4.1 Update `handleTextMessage()` in `src/line/webhook.ts` — pass `house.monthly_rate` to `getOutstandingBalance()` and `verifySlip()` instead of `settings.monthly_fee_amount`
- [x] 4.2 Update `handleImageMessage()` — pass `house.monthly_rate` to slip verification
- [x] 4.3 Update "เช็คยอดค้าง" handler — use house's own monthly_rate and due_date, show prior arrears in balance
- [x] 4.4 Update registration flow — accept house number with or without "29/" prefix, auto-prepend if missing
- [x] 4.5 Update `buildOutstandingBalance()` in `src/line/messages.ts` — show per-house rate and prior arrears breakdown
- [x] 4.6 Update `buildHelpMessage()` — accept optional house record to show house-specific rate
- [x] 4.7 Update `buildPaymentConfirmation()` and `buildMultiMonthConfirmation()` — use house rate instead of global rate

## 5. Dashboard Sheets Service

- [x] 5.1 Update `getSettings()` in `dashboard/src/lib/sheets.ts` — read `settings!A2:C2`, remove monthly_fee_amount
- [x] 5.2 Update `getAllHouses()` — read `houses!A2:K`, map all 11 columns
- [x] 5.3 Update `addHouse()` — write `houses!A:K` including new columns
- [x] 5.4 Update `updateHouse()` — write `houses!A:K` range per row
- [x] 5.5 Update `getAllPayments()` — read `payments!A2:K`, include discount in each record
- [x] 5.6 Update `addPaymentRecord()` — write to `payments!A:K` including discount
- [x] 5.7 Rewrite `getAllOverdueHouses()` — use `due_date` (fallback `move_in_date`), per-house `monthly_rate`, include prior_arrears
- [x] 5.8 Rewrite `getOutstandingBalance()` — same logic as bot version (due_date + monthly_rate + prior_arrears)
- [x] 5.9 Update `OverdueHouse` interface — add `monthly_rate`, `prior_arrears_remaining` fields

## 6. Dashboard API Routes

- [x] 6.1 Update `api/dashboard/route.ts` — calculate target as sum of per-house monthly_rate instead of flat count × fee, same for bar chart targets
- [x] 6.2 Update `api/houses/route.ts` — handle new fields in add/update operations, sort "29/X" format correctly
- [x] 6.3 Update `api/overdue/route.ts` — already uses `getAllOverdueHouses()`, verify response shape matches new interface
- [x] 6.4 Update `api/payments/route.ts` — include discount in add/read operations
- [x] 6.5 Update `api/settings/route.ts` — remove monthly_fee_amount from read/write

## 7. Dashboard Pages

- [x] 7.1 Update `houses/page.tsx` — show monthly_rate, due_date columns in table; add monthly_rate and due_date to add/edit forms
- [x] 7.2 Update `overdue/page.tsx` — show monthly_rate per house, show prior_arrears breakdown, highlight remaining prior arrears
- [x] 7.3 Update `dashboard/page.tsx` — stats already fed from API (auto-fixes), no manual changes expected
- [x] 7.4 Update `payments/page.tsx` — show discount column if non-zero
- [x] 7.5 Update `settings/page.tsx` — remove monthly_fee_amount field from settings form

## 8. Migration Scripts

- [x] 8.1 Create `scripts/migrate-houses.ts` — add column G–K headers, prefix existing house_number with "29/"
- [x] 8.2 Create `scripts/import-csv-data.ts` — read CSV, update/insert house data (monthly_rate, dates, arrears), import payment records with discount calculation
- [x] 8.3 Update `scripts/setup-settings.js` — remove monthly_fee_amount, write only bank_account_number, bank_name, village_name
- [x] 8.4 Add idempotency checks in import script — skip existing payment records (match house_number + month + year + recorded_by)

## 9. Build & Verify

- [x] 9.1 Verify TypeScript build passes (`npx tsc --noEmit`) for bot
- [x] 9.2 Verify Next.js build passes for dashboard (`cd dashboard && npm run build`)
- [x] 9.3 Run existing tests (`npx jest`) — update test fixtures for new types
- [x] 9.4 Run migrate-houses script on production sheet
- [x] 9.5 Run import-csv-data script on production sheet
- [x] 9.6 Verify dashboard shows correct data after import
