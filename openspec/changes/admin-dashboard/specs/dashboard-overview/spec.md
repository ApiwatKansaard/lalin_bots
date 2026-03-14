## ADDED Requirements

### Requirement: Dashboard statistics cards
The system SHALL display 4 stat cards: total collected this month, outstanding amount, total houses, and overdue count (houses with ≥1 month unpaid).

#### Scenario: View dashboard stats
- **WHEN** an admin visits the /dashboard page
- **THEN** the system displays 4 stat cards with current data from Google Sheets

### Requirement: Monthly collection bar chart
The system SHALL display a bar chart showing monthly collection vs target for the last 12 months using Recharts.

#### Scenario: View collection chart
- **WHEN** an admin views the dashboard
- **THEN** a bar chart shows actual collections and target amounts for each of the last 12 months

### Requirement: Payment status donut chart
The system SHALL display a donut chart showing paid vs unpaid houses for the current month using Recharts.

#### Scenario: View payment status chart
- **WHEN** an admin views the dashboard
- **THEN** a donut chart shows the ratio of paid to unpaid houses for the current month

### Requirement: Recent payments table
The system SHALL display the 10 most recent payment transactions.

#### Scenario: View recent payments
- **WHEN** an admin views the dashboard
- **THEN** a table shows the last 10 payments with house number, resident name, amount, date, and status

### Requirement: Auto-refresh
The system SHALL auto-refresh dashboard data every 5 minutes.

#### Scenario: Auto-refresh triggers
- **WHEN** 5 minutes have elapsed since the last data fetch
- **THEN** the dashboard data refreshes automatically without page reload
