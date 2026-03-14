## ADDED Requirements

### Requirement: Extract payment data from slip image
The system SHALL send the slip image to Claude Vision API and extract: transfer amount, transfer date, sending bank, receiving bank, and transaction reference number.

#### Scenario: Clear slip image submitted
- **WHEN** a slip image with legible text is sent to Claude Vision
- **THEN** the system extracts amount, date, sending bank, receiving bank, and transaction reference number

#### Scenario: Unreadable slip image
- **WHEN** a slip image is too blurry or damaged to extract data
- **THEN** the system replies to the resident: "ไม่สามารถอ่านข้อมูลจากสลิปได้ กรุณาถ่ายภาพใหม่ให้ชัดเจน"

### Requirement: Validate transfer amount against monthly fee
The system SHALL compare the extracted amount against the `monthly_fee_amount` from the settings sheet.

#### Scenario: Correct amount
- **WHEN** the extracted amount matches the monthly fee amount
- **THEN** validation passes and processing continues

#### Scenario: Incorrect amount
- **WHEN** the extracted amount does not match the monthly fee amount
- **THEN** the system replies with: "จำนวนเงินไม่ตรงกับค่าส่วนกลาง (ยอดที่ต้องจ่าย: {expected} บาท, ยอดที่โอน: {actual} บาท)"

### Requirement: Validate recipient bank account
The system SHALL verify that the receiving bank account on the slip matches the village's `bank_account_number` and `bank_name` from the settings sheet.

#### Scenario: Correct recipient account
- **WHEN** the receiving bank account matches the village's configured account
- **THEN** validation passes and processing continues

#### Scenario: Wrong recipient account
- **WHEN** the receiving bank account does not match the village's configured account
- **THEN** the system replies with: "บัญชีปลายทางไม่ถูกต้อง กรุณาโอนเงินไปยังบัญชี {bank_name} {bank_account_number}"

### Requirement: Detect duplicate slips
The system SHALL check the extracted transaction reference number against all existing records in the payments sheet.

#### Scenario: New transaction reference
- **WHEN** the transaction reference does not exist in the payments sheet
- **THEN** validation passes and processing continues

#### Scenario: Duplicate transaction reference
- **WHEN** the transaction reference already exists in the payments sheet
- **THEN** the system replies with: "สลิปนี้เคยถูกบันทึกแล้ว (ref: {transaction_ref})" and does not create a new record

### Requirement: Assess slip authenticity
The system SHALL instruct Claude Vision to check for signs of image manipulation (e.g., inconsistent fonts, edited amounts, obvious Photoshop artifacts).

#### Scenario: Authentic slip
- **WHEN** Claude Vision detects no signs of manipulation
- **THEN** validation passes and processing continues

#### Scenario: Suspected forged slip
- **WHEN** Claude Vision detects signs of image manipulation
- **THEN** the system replies with: "สลิปมีความผิดปกติ กรุณาติดต่อกรรมการหมู่บ้าน" and does not record the payment
