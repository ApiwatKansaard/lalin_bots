## ADDED Requirements

### Requirement: Webhook endpoint accepts LINE events
The system SHALL expose a POST `/webhook` endpoint that receives LINE Messaging API webhook events and responds with HTTP 200 immediately.

#### Scenario: Valid webhook event received
- **WHEN** LINE platform sends a POST request to `/webhook` with a valid signature
- **THEN** the server responds with HTTP 200 within 1 second and processes the event asynchronously

#### Scenario: Invalid signature rejected
- **WHEN** a POST request arrives at `/webhook` with an invalid or missing `x-line-signature` header
- **THEN** the server responds with HTTP 400 and does not process the event

### Requirement: Image messages routed to slip verification
The system SHALL detect image message events and route them to the slip verification pipeline.

#### Scenario: Resident sends an image
- **WHEN** a LINE user sends an image message to the bot
- **THEN** the system downloads the image content via LINE Content API and passes it to the slip verification service

#### Scenario: Non-image message routed to text handler
- **WHEN** a LINE user sends a text message to the bot
- **THEN** the system routes it to the text message handler (not to slip verification)

### Requirement: User identification from webhook events
The system SHALL extract the LINE user ID from each webhook event and use it to look up the resident's house number from the houses sheet.

#### Scenario: Known resident sends a message
- **WHEN** a webhook event arrives from a LINE user ID that exists in the houses sheet
- **THEN** the system associates the message with the corresponding house number

#### Scenario: Unknown user sends a message
- **WHEN** a webhook event arrives from a LINE user ID not found in the houses sheet
- **THEN** the system replies with a message asking the resident to contact the committee to register their house number
