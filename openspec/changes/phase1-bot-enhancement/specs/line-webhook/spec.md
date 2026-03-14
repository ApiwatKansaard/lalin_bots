## ADDED Requirements

### Requirement: Handle follow event with welcome message
The system SHALL respond to LINE follow events by sending a welcome message to the new user.

#### Scenario: User adds bot as friend
- **WHEN** a LINE user adds the bot as a friend (follow event)
- **THEN** the system sends a welcome message introducing the bot and instructing the user to tap "ลงทะเบียนบ้าน" in the Rich Menu to get started

### Requirement: Handle unfollow event
The system SHALL log unfollow events for monitoring purposes.

#### Scenario: User blocks the bot
- **WHEN** a LINE user blocks/unfollows the bot
- **THEN** the system logs the event with the user ID (no message is sent since the user has blocked the bot)

### Requirement: Handle unsupported message types
The system SHALL respond with a friendly error message when receiving message types other than text and image.

#### Scenario: User sends sticker
- **WHEN** a LINE user sends a sticker message
- **THEN** the system replies with "ขออภัยค่ะ ระบบรองรับเฉพาะข้อความและรูปสลิปเท่านั้น"

#### Scenario: User sends video or audio
- **WHEN** a LINE user sends a video or audio message
- **THEN** the system replies with "ขออภัยค่ะ ระบบรองรับเฉพาะข้อความและรูปสลิปเท่านั้น"

#### Scenario: User sends file or location
- **WHEN** a LINE user sends a file or location message
- **THEN** the system replies with "ขออภัยค่ะ ระบบรองรับเฉพาะข้อความและรูปสลิปเท่านั้น"

### Requirement: Registration-aware message routing
The system SHALL check the user's registration state before processing text messages, routing to the registration handler if the user is in an active registration flow.

#### Scenario: User in registration state sends house number
- **WHEN** a user in `awaiting_house_number` state sends a text message
- **THEN** the system routes the message to the registration handler instead of the normal text handler

## MODIFIED Requirements

### Requirement: Unknown user sends a message
The system SHALL extract the LINE user ID from each webhook event and use it to look up the resident's house number from the houses sheet. For unknown users, the system SHALL allow registration instead of only showing an error.

#### Scenario: Known resident sends a message
- **WHEN** a webhook event arrives from a LINE user ID that exists in the houses sheet
- **THEN** the system associates the message with the corresponding house number

#### Scenario: Unknown user sends a message
- **WHEN** a webhook event arrives from a LINE user ID not found in the houses sheet
- **THEN** the system checks if the user is in a registration flow; if not, the system replies asking them to tap "ลงทะเบียนบ้าน" in the menu below to register, instead of only telling them to contact the committee

#### Scenario: Unknown user sends "ลงทะเบียน"
- **WHEN** an unknown user sends the text "ลงทะเบียน"
- **THEN** the system initiates the registration flow (asks for house number)
