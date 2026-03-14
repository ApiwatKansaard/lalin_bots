## ADDED Requirements

### Requirement: Overdue house listing
The system SHALL list all houses with ≥1 month outstanding payment, sorted by months overdue descending.

#### Scenario: View overdue list
- **WHEN** an admin visits the /overdue page
- **THEN** a table shows house_number, resident_name, months_overdue, and total_amount_owed sorted by months_overdue descending

### Requirement: Severity highlighting
The system SHALL highlight rows red where overdue months ≥ 3.

#### Scenario: High severity overdue
- **WHEN** a house has 3 or more months overdue
- **THEN** its row is highlighted in red

### Requirement: LINE reminder sending
The system SHALL allow admins to send a LINE push message reminder to a specific resident's line_user_id.

#### Scenario: Send LINE reminder
- **WHEN** an admin clicks "Send LINE reminder" for an overdue house
- **THEN** the system sends a push message via LINE Messaging API to the resident's line_user_id with the overdue amount details
