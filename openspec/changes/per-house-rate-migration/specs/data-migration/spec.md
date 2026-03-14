## ADDED Requirements

### Requirement: Migrate existing houses sheet schema
The migration script SHALL add columns G–K to the existing houses sheet with headers: monthly_rate, transfer_date, due_date, prior_arrears, prior_arrears_paid. Existing data in columns A–F SHALL be preserved.

#### Scenario: Headers added to existing sheet
- **WHEN** the migrate-houses script runs on a houses sheet that has columns A–F
- **THEN** columns G–K headers are written to row 1 and existing data in A–F is unchanged

### Requirement: Prefix house numbers with "29/"
The migration script SHALL update all existing house_number values in the houses sheet by prefixing them with "29/" (e.g., "8" becomes "29/8").

#### Scenario: House number already has prefix
- **WHEN** a house_number already starts with "29/"
- **THEN** the script does not double-prefix it (no "29/29/8")

#### Scenario: House number without prefix
- **WHEN** a house_number is "42"
- **THEN** the script updates it to "29/42"

### Requirement: Import house data from CSV
The import script SHALL read the committee CSV and update or insert house records with monthly_rate, transfer_date, due_date, prior_arrears, and prior_arrears_paid.

#### Scenario: House exists in sheet — update fields
- **WHEN** house "29/8" exists in the houses sheet and appears in the CSV
- **THEN** the script updates columns G–K with the CSV data (monthly_rate=1300, transfer_date, due_date, prior_arrears=23400, prior_arrears_paid=5200) without overwriting columns A–F

#### Scenario: House in CSV but not in sheet — insert new row
- **WHEN** house "29/174" appears in the CSV but not in the houses sheet
- **THEN** the script appends a new row with house_number="29/174", resident_name from CSV, empty line_user_id/phone, move_in_date from CSV transfer_date, is_active="TRUE", and columns G–K from CSV

### Requirement: Import payment records from CSV
The import script SHALL read monthly payment columns (ม.ค.–ธ.ค.) from the CSV and append payment records to the payments sheet for year 2025.

#### Scenario: Monthly payment exists in CSV
- **WHEN** house "29/39" has a value of 592 in the ม.ค. column
- **THEN** the script appends a payment record: house_number="29/39", resident_name from CSV, month="1", year="2568", amount="592", paid_date="2568", transaction_ref="CSV-IMPORT", slip_image_url="", verified_status="verified", recorded_by="csv-import", discount calculated from rate difference

#### Scenario: Monthly payment empty in CSV
- **WHEN** house "29/39" has no value in the เม.ย. column
- **THEN** no payment record is created for that month

#### Scenario: Discount calculation for imported payments
- **WHEN** house "29/119" has monthly_rate=600 but pays 576 per month
- **THEN** each imported payment record has amount="576" and discount="24" (600 - 576)

### Requirement: Import is idempotent
The import script SHALL check for existing records before inserting to prevent duplicates.

#### Scenario: Re-running import after successful import
- **WHEN** the import script is run a second time on the same CSV
- **THEN** no duplicate payment records are created (checks for existing house_number + month + year + recorded_by="csv-import")

### Requirement: Update settings sheet schema
The migration script SHALL remove the monthly_fee_amount column from the settings sheet, shifting remaining columns (bank_account_number, bank_name, village_name) to A:C.

#### Scenario: Settings sheet updated
- **WHEN** the migration script runs
- **THEN** settings row 1 has headers: bank_account_number, bank_name, village_name, and row 2 has the corresponding values
