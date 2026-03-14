## ADDED Requirements

### Requirement: Payment confirmation Flex Message
The system SHALL reply with a LINE Flex Message card showing payment summary after a successful slip verification.

#### Scenario: Successful payment confirmation
- **WHEN** a payment is verified and recorded
- **THEN** the bot sends a Flex Message containing: village name, house number, resident name, amount paid, payment date, month/year, transaction reference, and a "✅ ชำระแล้ว" status badge

### Requirement: Rich Menu with quick actions
The system SHALL configure a LINE Rich Menu with three action buttons: "ส่งสลิป", "เช็คยอดค้าง", "ประวัติการจ่าย".

#### Scenario: Resident taps "ส่งสลิป"
- **WHEN** a resident taps the "ส่งสลิป" button on the Rich Menu
- **THEN** the bot sends a message guiding the resident to send their payment slip image

#### Scenario: Resident taps "เช็คยอดค้าง"
- **WHEN** a resident taps the "เช็คยอดค้าง" button on the Rich Menu
- **THEN** the bot retrieves and displays the resident's outstanding balance with unpaid month details

#### Scenario: Resident taps "ประวัติการจ่าย"
- **WHEN** a resident taps the "ประวัติการจ่าย" button on the Rich Menu
- **THEN** the bot retrieves and displays the resident's recent payment history as a Flex Message carousel

### Requirement: Outstanding balance display
The system SHALL display outstanding balance information as a Flex Message showing unpaid months and total amount owed.

#### Scenario: Resident has outstanding balance
- **WHEN** a resident checks their balance and has unpaid months
- **THEN** the bot sends a Flex Message listing each unpaid month, the per-month fee, and total outstanding amount

#### Scenario: Resident is fully paid
- **WHEN** a resident checks their balance and is fully paid up
- **THEN** the bot sends a message: "คุณไม่มียอดค้างชำระ ✅"

### Requirement: Payment history display
The system SHALL display payment history as a Flex Message carousel showing recent payments.

#### Scenario: Resident has payment history
- **WHEN** a resident requests payment history with existing records
- **THEN** the bot sends a Flex Message carousel with up to 10 most recent payments, each showing month/year, amount, date, and status

#### Scenario: No payment history
- **WHEN** a resident requests payment history with no records
- **THEN** the bot replies: "ยังไม่มีประวัติการชำระเงิน"

### Requirement: Text-based payment status check
The system SHALL respond to text messages containing payment-related keywords with current month's payment status.

#### Scenario: Resident asks about payment status via text
- **WHEN** a resident sends a text message containing keywords like "สถานะ", "จ่ายแล้วยัง", or "เช็คยอด"
- **THEN** the bot replies with the current month's payment status for that resident's house

#### Scenario: Unrecognized text message
- **WHEN** a resident sends a text message that doesn't match any known keywords
- **THEN** the bot replies with a help message listing available commands
