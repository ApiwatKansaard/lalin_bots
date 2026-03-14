## Why

Each house in the village has a different monthly maintenance fee (600–1,522.50 baht) based on its land area, but the current system uses a single flat rate from the settings sheet (700 baht). This causes incorrect overdue calculations, wrong slip verification amounts, and misleading dashboard statistics. Additionally, overdue tracking currently starts from `move_in_date` instead of the contractual `due_date`, and there is no way to record historical arrears or per-payment discounts. The committee has provided a CSV with complete 2025 data for 147 houses that needs to be imported.

## What Changes

- **Houses sheet schema expansion**: Add columns G–K for `monthly_rate`, `transfer_date`, `due_date`, `prior_arrears`, `prior_arrears_paid`. Prefix all house numbers with "29/".
- **Payments sheet schema expansion**: Add column K for `discount`.
- **Remove `monthly_fee_amount` from settings**: Each house uses its own `monthly_rate` instead of a global fee. **BREAKING**
- **Overdue calculation**: Start counting from `due_date` (not `move_in_date`), use per-house `monthly_rate`, and factor in `prior_arrears`/`prior_arrears_paid`.
- **Slip verification**: Validate transfer amounts against the house's own `monthly_rate` instead of the global setting.
- **Dashboard updates**: Show per-house rates, prior arrears, discount data. Fix target calculations to sum individual house rates.
- **Data migration script**: Import 147 houses and 669 payment records from the 2025 CSV, including historical arrears and discounts for 20 houses.

## Capabilities

### New Capabilities
- `data-migration`: Scripts to migrate existing houses sheet (add columns, prefix "29/"), import CSV data (houses + payment records), and populate prior arrears.

### Modified Capabilities
- `payment-recording`: Add `discount` field to PaymentRecord. Remove dependency on global `monthly_fee_amount`. Use `house.monthly_rate` for amount calculations. Add `prior_arrears` / `prior_arrears_paid` to outstanding balance.
- `slip-verification`: Validate slip amount against per-house `monthly_rate` instead of global `monthly_fee_amount`.
- `line-webhook`: Pass per-house `monthly_rate` through the payment and verification flow instead of reading from settings.
- `user-registration`: Update house lookup ranges from A2:F to A2:K for new columns.

## Impact

- **Google Sheets**: `houses` sheet adds 5 columns (G–K), `payments` adds 1 column (K), `settings` loses `monthly_fee_amount` column
- **Bot backend** (`src/`): `types/index.ts`, `services/sheets.ts`, `services/slip-verification.ts`, `line/webhook.ts`, `line/messages.ts`
- **Dashboard** (`dashboard/src/`): `lib/sheets.ts`, all 4 API routes, all 4 admin pages
- **New scripts**: `scripts/migrate-houses.ts`, `scripts/import-csv-data.ts`
- **Breaking**: Any code reading `settings.monthly_fee_amount` will break — must use `house.monthly_rate`
