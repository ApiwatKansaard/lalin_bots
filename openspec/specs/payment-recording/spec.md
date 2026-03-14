## Requirements

### Requirement: Record payment to Google Sheet
The system SHALL append a new row to the "payments" sheet with: house_number, resident_name, month, year, amount, paid_date, transaction_ref, slip_image_url, verified_status, recorded_by. For multi-month payments, the system SHALL create one row per month, assigning to the earliest unpaid months.

#### Scenario: Verified payment recorded
- **WHEN** a slip passes all verification checks
- **THEN** a new row is appended to the payments sheet with `verified_status` = "verified" and `recorded_by` = "bot"

#### Scenario: Single-month payment recorded with correct month assignment
- **WHEN** a resident pays exactly the monthly fee amount
- **THEN** the payment is recorded with `month` and `year` corresponding to the earliest unpaid month for that house (not the current date)

#### Scenario: Multi-month payment recorded
- **WHEN** a resident pays an amount equal to N × monthly_fee (e.g., 2100 = 3 × 700)
- **THEN** the system creates N separate payment records, each assigned to the next earliest unpaid month for that house

#### Scenario: Multi-month payment cap
- **WHEN** a resident pays an amount that would cover more than 12 months
- **THEN** the system rejects the payment with an error message indicating the amount is too large

### Requirement: Find house by house number
The system SHALL provide a `findHouseByNumber()` function that looks up a house record by its house number in the houses sheet.

#### Scenario: House number exists
- **WHEN** `findHouseByNumber("42")` is called and house 42 exists in the houses sheet
- **THEN** the function returns the full `HouseRecord` including house_number, resident_name, line_user_id, phone, move_in_date, is_active

#### Scenario: House number does not exist
- **WHEN** `findHouseByNumber("999")` is called and house 999 does not exist
- **THEN** the function returns null

### Requirement: Update house LINE user ID
The system SHALL provide an `updateHouseLineUserId()` function that writes a LINE user ID to the `line_user_id` column for a specific house number.

#### Scenario: Successfully link user to house
- **WHEN** `updateHouseLineUserId("42", "U1234abcd")` is called
- **THEN** the `line_user_id` column (column C) for the row with house_number "42" is updated to "U1234abcd" in the houses sheet

### Requirement: Detect duplicate payment for same month
The system SHALL check whether a payment already exists for the same house and month before recording a new one.

#### Scenario: No existing payment for month
- **WHEN** a payment is being recorded for house 42, month 3, year 2026, and no such record exists
- **THEN** the payment is recorded normally

#### Scenario: Payment already exists for month
- **WHEN** a payment is being recorded for house 42, month 3, year 2026, and a verified payment already exists for that house/month/year
- **THEN** the system returns an indication that the month is already paid, allowing the caller to inform the user

### Requirement: Look up house data
The system SHALL read the "houses" sheet to find a resident's house_number, resident_name, and other details by their `line_user_id`.

#### Scenario: Resident found by LINE user ID
- **WHEN** a query is made with a LINE user ID that exists in the houses sheet
- **THEN** the system returns the matching house_number and resident_name

#### Scenario: Resident not found
- **WHEN** a query is made with a LINE user ID not in the houses sheet
- **THEN** the system returns null and the caller handles the unknown user flow

### Requirement: Read village settings
The system SHALL read the "settings" sheet to retrieve `monthly_fee_amount`, `bank_account_number`, `bank_name`, and `village_name`.

#### Scenario: Settings loaded successfully
- **WHEN** the system reads the settings sheet
- **THEN** it returns the monthly fee amount, bank account number, bank name, and village name

### Requirement: Check outstanding balance
The system SHALL calculate a resident's outstanding balance by comparing paid months against all expected months since their move-in date.

#### Scenario: Resident with no outstanding balance
- **WHEN** a resident has paid for all months from move-in to current month
- **THEN** the system returns 0 outstanding balance and a list of paid months

#### Scenario: Resident with outstanding months
- **WHEN** a resident has missed payments for some months
- **THEN** the system returns the total outstanding amount and a list of unpaid months

### Requirement: Retrieve payment history
The system SHALL query the payments sheet filtered by house_number and return all payment records sorted by date descending.

#### Scenario: Resident with payment history
- **WHEN** a resident requests payment history and has recorded payments
- **THEN** the system returns a list of payments with month, year, amount, paid_date, and verified_status

#### Scenario: Resident with no payment history
- **WHEN** a resident requests payment history but has no recorded payments
- **THEN** the system returns an empty list
