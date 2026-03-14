## MODIFIED Requirements

### Requirement: Validate transfer amount against monthly fee
The system SHALL compare the extracted amount against the house's `monthly_rate` (not a global setting). The amount SHALL be accepted if it is a positive multiple of the house's monthly rate (supporting multi-month payments), up to a maximum of 12 months.

#### Scenario: Correct amount (single month)
- **WHEN** house 29/70 has monthly_rate=700 and the extracted amount is 700
- **THEN** validation passes and processing continues with monthCount = 1

#### Scenario: Correct amount (multiple months)
- **WHEN** house 29/35 has monthly_rate=600 and the extracted amount is 1800
- **THEN** validation passes and processing continues with monthCount = 3

#### Scenario: Amount not a multiple of house monthly rate
- **WHEN** house 29/70 has monthly_rate=700 and the extracted amount is 650
- **THEN** the system replies with: "จำนวนเงินไม่ตรงกับค่าส่วนกลาง (ค่าส่วนกลางบ้านเลขที่ 29/70 เดือนละ 700 บาท, ยอดที่โอน: 650 บาท)"

#### Scenario: Amount exceeds 12-month cap
- **WHEN** house 29/70 has monthly_rate=700 and the extracted amount is 9100 (13 months)
- **THEN** the system replies with: "จำนวนเงินมากเกินไป กรุณาติดต่อกรรมการหมู่บ้าน"

### Requirement: verifySlip accepts per-house monthly rate
The `verifySlip()` function SHALL accept the house's `monthly_rate` as a parameter instead of reading from the global settings.

#### Scenario: Verify slip with house-specific rate
- **WHEN** verifySlip is called for house 29/100 with monthly_rate=1522.5
- **THEN** the amount validation uses 1522.5 as the expected monthly amount
