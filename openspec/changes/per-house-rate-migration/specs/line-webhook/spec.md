## MODIFIED Requirements

### Requirement: User identification from webhook events
The system SHALL extract the LINE user ID from each webhook event and use it to look up the resident's house record from the houses sheet (columns A–K). For known users, the system SHALL use the house's `monthly_rate` for payment operations instead of a global fee.

#### Scenario: Known resident sends a message
- **WHEN** a webhook event arrives from a LINE user ID that exists in the houses sheet
- **THEN** the system associates the message with the corresponding house record including monthly_rate, due_date, and prior_arrears

#### Scenario: Slip verification uses house monthly rate
- **WHEN** a known resident sends a slip image for verification
- **THEN** the system passes the house's `monthly_rate` to the slip verification service instead of reading from settings

#### Scenario: Outstanding balance uses house data
- **WHEN** a known resident requests "เช็คยอดค้าง"
- **THEN** the system calculates outstanding balance using the house's `monthly_rate` and `due_date`, including remaining prior arrears

### Requirement: Text command "เช็คยอดค้าง" shows per-house rate
The system SHALL display the house's own monthly rate when showing outstanding balance, not a global rate.

#### Scenario: User checks balance with house-specific rate
- **WHEN** resident of house 29/100 (monthly_rate=1522.50) sends "เช็คยอดค้าง"
- **THEN** the system shows the balance calculated at 1522.50 per month, including any prior arrears

### Requirement: Help message shows house-specific rate
The system SHALL include the house's monthly rate in the help/info response when the user is registered.

#### Scenario: Registered user requests help
- **WHEN** resident of house 29/70 (monthly_rate=700) sends "วิธีใช้งาน"
- **THEN** the help message includes "ค่าส่วนกลางบ้านเลขที่ 29/70: 700 บาท/เดือน"
