## ADDED Requirements

### Requirement: House listing
The system SHALL display all houses from the "houses" sheet in a table.

#### Scenario: View all houses
- **WHEN** an admin visits the /houses page
- **THEN** a table shows all houses with house_number, resident_name, phone, move_in_date, and is_active status

### Requirement: Add new house
The system SHALL provide a form to add a new house record to the "houses" sheet.

#### Scenario: Add house successfully
- **WHEN** an admin fills in house_number, resident_name, line_user_id, phone, move_in_date and submits
- **THEN** a new row is appended to the "houses" sheet with is_active set to "TRUE"

### Requirement: Edit house
The system SHALL allow inline editing of house records.

#### Scenario: Edit house details
- **WHEN** an admin edits a house's resident_name or phone and saves
- **THEN** the corresponding row in the "houses" sheet is updated

### Requirement: Toggle house active status
The system SHALL allow toggling a house's is_active field.

#### Scenario: Deactivate a house
- **WHEN** an admin toggles a house from active to inactive
- **THEN** the is_active field in the "houses" sheet is updated to "FALSE"
