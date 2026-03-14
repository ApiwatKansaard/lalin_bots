## ADDED Requirements

### Requirement: Express server with health check
The system SHALL start an Express HTTP server on a configurable port with a GET `/health` endpoint returning HTTP 200.

#### Scenario: Server starts successfully
- **WHEN** the application starts
- **THEN** the Express server listens on the configured PORT and logs a startup message

#### Scenario: Health check responds
- **WHEN** a GET request is made to `/health`
- **THEN** the server responds with HTTP 200 and `{ "status": "ok" }`

### Requirement: Environment-based configuration
The system SHALL load all configuration from environment variables with validation at startup.

#### Scenario: All required environment variables present
- **WHEN** the application starts with all required environment variables set (LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN, GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, ANTHROPIC_API_KEY, PORT)
- **THEN** the application starts normally

#### Scenario: Missing required environment variable
- **WHEN** the application starts with a required environment variable missing
- **THEN** the application logs the missing variable name and exits with a non-zero code

### Requirement: LINE SDK initialization
The system SHALL initialize the LINE Messaging API client with channel secret and access token from environment variables.

#### Scenario: LINE client initialized
- **WHEN** the application starts with valid LINE credentials
- **THEN** the LINE client is available for sending replies and push messages

### Requirement: Google Sheets client initialization
The system SHALL authenticate with Google Sheets API using service account credentials from environment variables.

#### Scenario: Google Sheets client initialized
- **WHEN** the application starts with valid Google service account credentials
- **THEN** the Google Sheets client is authenticated and ready to read/write the configured spreadsheet
