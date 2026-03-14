## ADDED Requirements

### Requirement: Admin user management
The system SHALL allow super_admin users to list, add, and remove admin users from the "admins" sheet.

#### Scenario: List admins
- **WHEN** a super_admin visits /settings/admins
- **THEN** a table shows all admins with email, role, and added_date

#### Scenario: Invite admin by email
- **WHEN** a super_admin enters an email and selects a role then clicks "Invite"
- **THEN** a new row is added to the "admins" sheet with the email, role, current date, and inviter's email

#### Scenario: Remove admin
- **WHEN** a super_admin clicks "Remove" on an admin row
- **THEN** the corresponding row is deleted from the "admins" sheet

### Requirement: Village settings editor
The system SHALL display and allow editing of village settings from the "settings" sheet.

#### Scenario: View current settings
- **WHEN** an admin visits /settings/line
- **THEN** the page displays monthly_fee_amount, bank_account_number, bank_name, village_name

#### Scenario: Update village settings
- **WHEN** an admin updates the settings form and submits
- **THEN** the "settings" sheet row is updated with the new values

### Requirement: LINE bot info display
The system SHALL display LINE bot webhook URL and QR code link on the settings page.

#### Scenario: View LINE bot info
- **WHEN** an admin visits /settings/line
- **THEN** the page shows the webhook URL (https://lalin-bots.onrender.com/webhook) and LINE bot QR code link
