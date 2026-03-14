## Context

The system currently stores a single `monthly_fee_amount` (700 baht) in the `settings` sheet and applies it uniformly to all 147 houses. In reality, each house has a different rate (600, 700, 875, 1105, 1300, 1360, or 1522.50 baht/month) based on land area. The committee manages this data in a separate spreadsheet with per-house rates, transfer dates, due dates, historical arrears, and monthly payment records for 2025.

Current Google Sheets schema:
- `houses` — A:F (house_number, resident_name, line_user_id, phone, move_in_date, is_active)
- `payments` — A:J (house_number, resident_name, month, year, amount, paid_date, transaction_ref, slip_image_url, verified_status, recorded_by)
- `settings` — A:D (monthly_fee_amount, bank_account_number, bank_name, village_name)

Overdue calculation currently starts from `move_in_date` instead of the contractual `due_date`.

## Goals / Non-Goals

**Goals:**
- Store per-house `monthly_rate`, `transfer_date`, `due_date`, `prior_arrears`, and `prior_arrears_paid` in the houses sheet
- Store per-payment `discount` in the payments sheet
- Remove `monthly_fee_amount` from settings (use house-level rate everywhere)
- Fix overdue calculation to count from `due_date`, not `move_in_date`
- Include `prior_arrears` (carry-forward from previous years) in total outstanding balance
- Import 147 houses and 669 payment records from the 2025 CSV
- Update all bot logic (webhook, slip verification, messages) to use per-house rates
- Update all dashboard pages and APIs to reflect new schema

**Non-Goals:**
- Redesigning the Rich Menu or registration flow (no changes)
- Adding new dashboard pages or views
- Changing the slip verification AI model or prompt
- Multi-tenant support or user role changes

## Decisions

### 1. Houses sheet expansion: A:F → A:K

Add 5 new columns after the existing 6:

```
G: monthly_rate       (number, e.g., 700)
H: transfer_date      (date string DD/MM/YYYY from CSV)
I: due_date            (date string DD/MM/YYYY — overdue starts from here)
J: prior_arrears       (number — total arrears carried from years before 2025)
K: prior_arrears_paid  (number — how much of prior arrears has been paid)
```

**Rationale**: Appending columns preserves existing A:F data and all code that reads columns A-F continues to work until updated. The migration script adds columns G-K to existing rows and inserts new rows for houses not yet in the sheet.

**Alternative considered**: Creating a separate `house_rates` sheet. Rejected because it would add JOIN complexity and every query would need two sheet reads.

### 2. House number format: prefix "29/"

All house numbers change from "8" to "29/8" format, matching the official village plot numbering (โครงการ 29/).

**Rationale**: Matches official documents and the committee's spreadsheet. The migration script updates existing rows and all CSV imports use the prefixed format.

**Risk**: LINE users who registered before this change have their `line_user_id` linked to the old house number format. The migration script must update these in-place.

### 3. Remove monthly_fee_amount from settings

Settings sheet changes from A:D to A:C (bank_account_number, bank_name, village_name). The `monthly_fee_amount` column is removed.

**Rationale**: With per-house rates, a global fee is misleading. All code paths that used `settings.monthly_fee_amount` now read `house.monthly_rate` directly.

### 4. Payments sheet: add discount column K

```
K: discount  (number — discount amount applied to this payment, 0 if none)
```

**Rationale**: 20 houses have discounts (paying 576 instead of 600, 672 instead of 700, etc.). Storing discount per-payment rather than per-house allows the discount to change over time without re-writing history.

### 5. Outstanding balance calculation

New formula:
```
remaining_prior_arrears = prior_arrears - prior_arrears_paid
current_period_unpaid = count_unpaid_months(due_date → now) × monthly_rate
total_outstanding = remaining_prior_arrears + current_period_unpaid
```

Overdue months are counted starting from `due_date + 1 month`, not `move_in_date`. If `due_date` is not set, fall back to `move_in_date` for backward compatibility.

### 6. Migration approach — two scripts

1. **`scripts/migrate-houses.ts`**: Reads existing houses sheet, adds "29/" prefix to house_number, adds headers for columns G-K. Non-destructive: preserves existing line_user_id and other data.

2. **`scripts/import-csv-data.ts`**: Reads the committee CSV, updates/inserts house data (monthly_rate, transfer_date, due_date, prior_arrears, prior_arrears_paid), and appends 2025 payment records with discount values.

**Execution order**: migrate-houses first, then import-csv-data. Both are idempotent (check before insert/update).

### 7. Dashboard target calculation

Dashboard's "target this month" changes from `activeHouses.length × settings.monthly_fee_amount` to `sum(activeHouses.map(h => h.monthly_rate))`. Same principle for bar chart targets and overdue amounts.

## Risks / Trade-offs

- **[Data loss during migration]** → Mitigation: Scripts are additive (append columns, don't delete). Manual backup of Google Sheet recommended before running.
- **[Existing LINE users have old house numbers]** → Mitigation: Migration script updates house_number in-place, preserving line_user_id linkage.
- **[Settings schema change breaks dashboard]** → Mitigation: Deploy code changes and run migration scripts atomically. VillageSettings type updated to remove monthly_fee_amount.
- **[CSV date format mismatch]** → CSV uses DD/MM/YYYY (Thai), Google Sheets may auto-convert. Mitigation: Store as string, parse explicitly in code.
- **[Houses in sheet but not in CSV]** → Keep existing rows, just add default monthly_rate (0) and flag for admin review.

## Migration Plan

1. **Backup** Google Sheet manually
2. **Deploy code** with updated types and functions (backward-compatible: new fields optional)
3. **Run migrate-houses.ts** — adds columns, prefixes house numbers
4. **Run import-csv-data.ts** — populates rates, dates, arrears, payment records
5. **Verify** via dashboard that data looks correct
6. **Rollback**: If issues, restore Google Sheet from backup. Code handles missing fields gracefully.
