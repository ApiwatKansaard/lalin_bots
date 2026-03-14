## ADDED Requirements

### Requirement: Payment listing with filters
The system SHALL display all payments in a table with filters for month, year, house_number, and verified_status.

#### Scenario: Filter payments by month and year
- **WHEN** an admin selects month "3" and year "2026"
- **THEN** the table shows only payments matching that month and year

### Requirement: CSV export
The system SHALL allow exporting filtered payment data as a CSV file.

#### Scenario: Export payments to CSV
- **WHEN** an admin clicks the "Export CSV" button
- **THEN** the browser downloads a CSV file containing the currently filtered payment records

### Requirement: Manual payment entry
The system SHALL provide a form to manually add payment records (for cash payments) which appends a row to the Google Sheet.

#### Scenario: Add manual cash payment
- **WHEN** an admin fills in the payment form with house_number, amount, month, year and submits
- **THEN** a new row is appended to the "payments" sheet with recorded_by set to the admin's email

### Requirement: Payment status update
The system SHALL allow admins to mark a payment as "verified" or "rejected" by updating the verified_status column in the sheet.

#### Scenario: Verify a payment
- **WHEN** an admin clicks "Verify" on a pending payment
- **THEN** the verified_status for that row in Google Sheets is updated to "verified"

#### Scenario: Reject a payment
- **WHEN** an admin clicks "Reject" on a pending payment
- **THEN** the verified_status for that row in Google Sheets is updated to "rejected"
