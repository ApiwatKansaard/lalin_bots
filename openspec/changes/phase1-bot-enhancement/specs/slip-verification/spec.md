## MODIFIED Requirements

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
