## MODIFIED Requirements

### Requirement: Record payment to Google Sheet
The system SHALL append a new row to the "payments" sheet with: house_number, resident_name, month, year, amount, paid_date, transaction_ref, slip_image_url, verified_status, recorded_by, discount. For multi-month payments, the system SHALL create one row per month, assigning to the earliest unpaid months. The amount per row SHALL be the house's `monthly_rate` minus any applicable discount.

#### Scenario: Verified payment recorded
- **WHEN** a slip passes all verification checks
- **THEN** a new row is appended to the payments sheet with `verified_status` = "verified", `recorded_by` = "bot", and `discount` = "0"

#### Scenario: Single-month payment recorded with correct month assignment
- **WHEN** a resident of house 29/70 (monthly_rate=700) pays exactly 700 baht
- **THEN** the payment is recorded with `month` and `year` corresponding to the earliest unpaid month for that house, and `discount` = "0"

#### Scenario: Multi-month payment recorded
- **WHEN** a resident of house 29/70 (monthly_rate=700) pays 2100 baht (3 × 700)
- **THEN** the system creates 3 separate payment records, each with amount=700 and assigned to the next earliest unpaid month

#### Scenario: Multi-month payment cap
- **WHEN** a resident pays an amount that would cover more than 12 months at their house's monthly_rate
- **THEN** the system rejects the payment with an error message indicating the amount is too large

### Requirement: Check outstanding balance
The system SHALL calculate a resident's outstanding balance by counting unpaid months from their `due_date` (not `move_in_date`) and using their house's `monthly_rate`. The total SHALL include remaining prior arrears.

#### Scenario: Resident with prior arrears and current unpaid
- **WHEN** house 29/8 has prior_arrears=23400, prior_arrears_paid=5200, monthly_rate=1300, due_date=31/12/2566, and 3 months unpaid since due_date
- **THEN** the system returns total_outstanding = (23400 - 5200) + (3 × 1300) = 22100

#### Scenario: Resident with no prior arrears
- **WHEN** house 29/76 has prior_arrears=0, monthly_rate=700, due_date=19/04/2567, and 2 months unpaid
- **THEN** the system returns total_outstanding = 2 × 700 = 1400

#### Scenario: Due date not set — fallback to move_in_date
- **WHEN** a house has no due_date set but has move_in_date
- **THEN** the system falls back to using move_in_date as the start date for overdue counting

### Requirement: Find house by house number
The system SHALL provide a `findHouseByNumber()` function that looks up a house record by its house number (e.g., "29/42") in the houses sheet, returning all columns A–K.

#### Scenario: House number exists
- **WHEN** `findHouseByNumber("29/42")` is called and house 29/42 exists
- **THEN** the function returns the full HouseRecord including monthly_rate, transfer_date, due_date, prior_arrears, prior_arrears_paid

### Requirement: Look up house data
The system SHALL read the "houses" sheet columns A–K to find a resident's house_number, resident_name, monthly_rate, and other details by their `line_user_id`.

#### Scenario: Resident found by LINE user ID
- **WHEN** a query is made with a LINE user ID that exists in the houses sheet
- **THEN** the system returns the matching HouseRecord including monthly_rate, due_date, prior_arrears fields

### Requirement: Read village settings
The system SHALL read the "settings" sheet to retrieve `bank_account_number`, `bank_name`, and `village_name` from columns A–C. The `monthly_fee_amount` field is removed.

#### Scenario: Settings loaded successfully
- **WHEN** the system reads the settings sheet
- **THEN** it returns bank_account_number, bank_name, and village_name (no monthly_fee_amount)

### Requirement: Retrieve payment history
The system SHALL query the payments sheet columns A–K filtered by house_number and return all payment records including the discount field, sorted by date descending.

#### Scenario: Resident with payment history including discounts
- **WHEN** house 29/119 requests payment history and has payments with discount=24
- **THEN** the system returns payment records with the discount field populated
