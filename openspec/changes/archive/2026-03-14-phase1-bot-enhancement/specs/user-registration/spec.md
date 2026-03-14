## ADDED Requirements

### Requirement: Registration initiation
The system SHALL respond to the text "ลงทะเบียน" (or the Rich Menu button press that sends this text) by asking the user to enter their house number.

#### Scenario: User taps register button
- **WHEN** an unregistered user sends the text "ลงทะเบียน"
- **THEN** the system replies with "กรุณาพิมพ์เลขบ้านของคุณ (เช่น 42)" and sets the user's state to `awaiting_house_number`

#### Scenario: Already registered user taps register
- **WHEN** a user who already has a linked `line_user_id` sends "ลงทะเบียน"
- **THEN** the system replies with "คุณลงทะเบียนบ้านเลขที่ {house_number} แล้วค่ะ" and does not change state

### Requirement: House number validation and linking
The system SHALL accept a house number from a user in `awaiting_house_number` state, validate it against the houses sheet, and link the LINE user ID if valid.

#### Scenario: Valid house number with no existing link
- **WHEN** a user in `awaiting_house_number` state enters a house number that exists in the houses sheet and has no `line_user_id` linked
- **THEN** the system writes the user's LINE user ID to the `line_user_id` column for that house, clears the registration state, switches the Rich Menu to the registered version, and replies with a success message including the house number and resident name

#### Scenario: House number not found
- **WHEN** a user in `awaiting_house_number` state enters a house number that does not exist in the houses sheet
- **THEN** the system replies with "ไม่พบบ้านเลขที่ {number} ในระบบ กรุณาตรวจสอบเลขบ้านอีกครั้ง" and keeps the state as `awaiting_house_number`

#### Scenario: House number already linked to another user
- **WHEN** a user in `awaiting_house_number` state enters a house number that already has a different `line_user_id` linked
- **THEN** the system replies with "บ้านเลขที่ {number} ลงทะเบียนแล้วโดยผู้อยู่อาศัยอื่น กรุณาติดต่อกรรมการหมู่บ้าน" and clears the registration state

#### Scenario: House not active
- **WHEN** a user enters a house number that exists but has `is_active` = "FALSE"
- **THEN** the system replies with "บ้านเลขที่ {number} ไม่ได้เปิดใช้งานในระบบ กรุณาติดต่อกรรมการหมู่บ้าน" and clears the registration state

### Requirement: Registration state management
The system SHALL maintain an in-memory map of user registration states with automatic expiry.

#### Scenario: State expires after timeout
- **WHEN** a user initiates registration but does not enter a house number within 15 minutes
- **THEN** the registration state is automatically cleared, and the next message from the user is treated normally

#### Scenario: State cleared on successful registration
- **WHEN** a user successfully links their house number
- **THEN** the registration state is removed from the in-memory map

### Requirement: Cancel registration
The system SHALL allow users to cancel an in-progress registration.

#### Scenario: User sends cancel during registration
- **WHEN** a user in `awaiting_house_number` state sends "ยกเลิก"
- **THEN** the system clears the registration state and replies with "ยกเลิกการลงทะเบียนแล้วค่ะ"

### Requirement: Google Sheets functions for registration
The system SHALL provide `findHouseByNumber()` and `updateHouseLineUserId()` functions in the sheets service.

#### Scenario: Find house by number
- **WHEN** `findHouseByNumber("42")` is called and house 42 exists
- **THEN** the function returns the full `HouseRecord` for house 42

#### Scenario: Update house LINE user ID
- **WHEN** `updateHouseLineUserId("42", "U1234abcd")` is called
- **THEN** the `line_user_id` column (column C) for house 42 in the houses sheet is updated to "U1234abcd"
