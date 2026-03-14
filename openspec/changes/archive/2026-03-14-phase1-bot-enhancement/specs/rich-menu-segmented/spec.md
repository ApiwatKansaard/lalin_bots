## ADDED Requirements

### Requirement: Two-segment Rich Menu system
The system SHALL create and manage two distinct Rich Menus: one for unregistered users (default) and one for registered users (per-user linked).

#### Scenario: Server startup creates both menus
- **WHEN** the bot server starts up
- **THEN** the system deletes all existing Rich Menus, creates the unregistered menu and the registered menu, and sets the unregistered menu as the default

#### Scenario: Unregistered user sees registration menu
- **WHEN** a user who has not registered opens the chat
- **THEN** the user sees a Rich Menu with a single large "ลงทะเบียนบ้าน" button (2500×843)

#### Scenario: Registered user sees full menu
- **WHEN** a user who has completed registration opens the chat
- **THEN** the user sees a Rich Menu with 4 large buttons in a 2×2 grid: ส่งสลิป, เช็คยอดค้าง, ประวัติการจ่าย, วิธีใช้งาน (2500×1686)

### Requirement: Clean up old Rich Menus on startup
The system SHALL delete all existing Rich Menus before creating new ones to prevent accumulation across server restarts.

#### Scenario: Multiple restarts do not duplicate menus
- **WHEN** the server has been restarted 10 times
- **THEN** only 2 Rich Menus exist (unregistered + registered), not 20+

### Requirement: Link registered menu per user
The system SHALL call `linkRichMenuToUser(userId, registeredMenuId)` when a user successfully completes registration, switching their visible menu to the registered version.

#### Scenario: Menu switches after registration
- **WHEN** a user successfully registers their house number
- **THEN** their Rich Menu immediately changes from the single "ลงทะเบียน" button to the full 4-button grid

#### Scenario: Menu persists across chat sessions
- **WHEN** a registered user closes and reopens the chat
- **THEN** they still see the registered 4-button Rich Menu (not the default unregistered one)

### Requirement: Registered menu uses full-height layout for elderly users
The registered Rich Menu SHALL use 2500×1686 pixel dimensions (full height) with a 2×2 button grid to maximize touch target size for elderly users.

#### Scenario: Button layout dimensions
- **WHEN** the registered Rich Menu is displayed
- **THEN** each button occupies approximately 1250×843 pixels (half-width, half-height), providing large touch targets

### Requirement: Store Rich Menu IDs for reuse
The system SHALL store the created Rich Menu IDs (unregistered and registered) in module-level variables so they can be referenced when linking menus to users during registration.

#### Scenario: Registration uses stored menu ID
- **WHEN** a user completes registration and the system needs to link the registered menu
- **THEN** the system uses the stored `registeredMenuId` without needing to query LINE API

### Requirement: Rich Menu button "วิธีใช้งาน" maps to help handler
The registered Rich Menu's bottom-right button SHALL send the text "วิธีใช้งาน" which the webhook text handler SHALL route to the existing `buildHelpMessage()` function.

#### Scenario: User taps "วิธีใช้งาน" button
- **WHEN** a registered user taps the "วิธีใช้งาน" button in the Rich Menu
- **THEN** the bot replies with the help message listing available commands

### Requirement: Rich Menu images must meet LINE size requirements
The Rich Menu images SHALL be exactly 2500×843 (unregistered) or 2500×1686 (registered) pixels and under 1MB file size.

#### Scenario: Image uploaded successfully to LINE
- **WHEN** the system uploads a Rich Menu image via LINE Messaging API
- **THEN** the image is accepted without error because it meets the exact pixel dimensions and is under 1MB
