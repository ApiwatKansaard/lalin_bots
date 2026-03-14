## ADDED Requirements

### Requirement: Record payment to Google Sheet
The system SHALL append a new row to the "payments" sheet with: house_number, resident_name, month, year, amount, paid_date, transaction_ref, slip_image_url, verified_status, recorded_by.

#### Scenario: Verified payment recorded
- **WHEN** a slip passes all verification checks
- **THEN** a new row is appended to the payments sheet with `verified_status` = "verified" and `recorded_by` = "bot"

#### Scenario: Payment recorded with correct month assignment
- **WHEN** a resident pays for the current billing month
- **THEN** the payment is recorded with `month` and `year` corresponding to the current billing period

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
