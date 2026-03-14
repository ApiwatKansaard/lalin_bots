## MODIFIED Requirements

### Requirement: House number validation and linking
The system SHALL accept a house number from a user in `awaiting_house_number` state, validate it against the houses sheet (columns A–K), and link the LINE user ID if valid. House numbers SHALL be accepted with or without the "29/" prefix.

#### Scenario: User enters house number without prefix
- **WHEN** a user in `awaiting_house_number` state enters "42"
- **THEN** the system looks up "29/42" in the houses sheet and proceeds with registration

#### Scenario: User enters house number with prefix
- **WHEN** a user in `awaiting_house_number` state enters "29/42"
- **THEN** the system looks up "29/42" directly in the houses sheet

#### Scenario: Valid house number with no existing link
- **WHEN** a user enters a house number that exists and has no `line_user_id` linked
- **THEN** the system writes the user's LINE user ID, clears registration state, switches Rich Menu, and replies with success message including house number, resident name, and monthly rate

### Requirement: Google Sheets functions use expanded column range
The sheets service functions SHALL read columns A–K from the houses sheet to include monthly_rate, transfer_date, due_date, prior_arrears, and prior_arrears_paid.

#### Scenario: findHouseByNumber returns full record
- **WHEN** `findHouseByNumber("29/42")` is called
- **THEN** the returned HouseRecord includes monthly_rate, transfer_date, due_date, prior_arrears, prior_arrears_paid

#### Scenario: getAllRegisteredLineUserIds reads correct range
- **WHEN** the system queries for registered LINE user IDs
- **THEN** it reads houses!A2:K and filters by column C (line_user_id)
