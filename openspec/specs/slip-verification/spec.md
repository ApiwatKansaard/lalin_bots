## Requirements

### Requirement: Extract payment data from slip image
The system SHALL send the slip image to Gemini AI and extract: transfer amount, transfer date, sending bank, receiving bank, and transaction reference number.

#### Scenario: Clear slip image submitted
- **WHEN** a slip image with legible text is sent to Gemini AI
- **THEN** the system extracts amount, date, sending bank, receiving bank, and transaction reference number

#### Scenario: Unreadable slip image
- **WHEN** a slip image is too blurry or damaged to extract data
- **THEN** the system replies to the resident: "ไม่สามารถอ่านข้อมูลจากสลิปได้ กรุณาถ่ายภาพใหม่ให้ชัดเจน"

### Requirement: Validate transfer amount against monthly fee
The system SHALL compare the extracted amount against the `monthly_fee_amount` from the settings sheet. The amount SHALL be accepted if it is a positive multiple of the monthly fee (supporting multi-month payments), up to a maximum of 12 months.

#### Scenario: Correct amount (single month)
- **WHEN** the extracted amount matches exactly the monthly fee amount
- **THEN** validation passes and processing continues with monthCount = 1

#### Scenario: Correct amount (multiple months)
- **WHEN** the extracted amount is a positive integer multiple of the monthly fee (e.g., 1400 = 2 × 700)
- **THEN** validation passes and processing continues with monthCount = amount / monthly_fee

#### Scenario: Amount not a multiple of monthly fee
- **WHEN** the extracted amount is not evenly divisible by the monthly fee
- **THEN** the system replies with: "จำนวนเงินไม่ตรงกับค่าส่วนกลาง (ค่าส่วนกลางเดือนละ {monthly_fee} บาท, ยอดที่โอน: {actual} บาท)"

#### Scenario: Amount exceeds 12-month cap
- **WHEN** the extracted amount divided by the monthly fee exceeds 12
- **THEN** the system replies with: "จำนวนเงินมากเกินไป กรุณาติดต่อกรรมการหมู่บ้าน"

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
The system SHALL instruct Gemini AI to check for signs of image manipulation (e.g., inconsistent fonts, edited amounts, obvious artifacts).

#### Scenario: Authentic slip
- **WHEN** Gemini AI detects no signs of manipulation
- **THEN** validation passes and processing continues

#### Scenario: Suspected forged slip
- **WHEN** Gemini AI detects signs of image manipulation
- **THEN** the system replies with: "สลิปมีความผิดปกติ กรุณาติดต่อกรรมการหมู่บ้าน" and does not record the payment
