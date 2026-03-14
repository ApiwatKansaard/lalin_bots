## Context

The village committee (หมู่บ้าน) currently relies on manual processes to collect and track monthly common area fees. Residents transfer money via bank apps and send payment slip photos to a LINE group chat. Committee members then manually verify slips and record payments in spreadsheets. This is slow, error-prone, and lacks duplicate detection.

We are building a greenfield LINE chatbot that automates this entire flow: receive slip → verify via AI → record to Google Sheets → reply with confirmation. The system targets a single village with ~100-300 houses.

**Constraints:**
- Must respond within 5 seconds of receiving a LINE webhook event
- Google Sheets is the sole data store (no database)
- Claude Vision API is the sole slip verification engine
- Residents interact only through LINE (no web UI)
- All secrets managed via environment variables

## Goals / Non-Goals

**Goals:**
- Automate slip verification and payment recording end-to-end
- Provide instant feedback to residents via LINE Flex Messages
- Detect duplicate slips by transaction reference number
- Allow residents to check outstanding balances and payment history
- Keep the system simple — minimal infrastructure, easy to maintain

**Non-Goals:**
- Admin dashboard or web interface (phase 2)
- Multi-village or multi-tenancy support
- Payment gateway integration (residents pay via bank transfer, not through the bot)
- Automated reminders or notifications for overdue payments (future feature)
- Thai language NLP / advanced text understanding (simple keyword matching suffices)

## Decisions

### 1. Google Sheets as data store (over a database)

**Choice:** Google Sheets API for all data persistence.
**Rationale:** The village committee already uses spreadsheets. Google Sheets provides a familiar interface for committee members to view/edit data directly, requires no database provisioning, and is free.
**Alternatives considered:**
- PostgreSQL on Railway: More robust but adds complexity, cost, and requires a separate admin UI for the committee
- Firebase Firestore: Low-latency but committee can't view data as easily; overkill for this scale

### 2. Claude Vision API for slip verification (over OCR libraries)

**Choice:** Anthropic Claude API with vision capability.
**Rationale:** Thai bank slips have varied layouts across banks. Claude Vision handles these variations well without custom training. It can also assess slip authenticity (detect obvious edits).
**Alternatives considered:**
- Tesseract OCR: Free but poor accuracy on Thai text and varied slip layouts
- Google Cloud Vision: Good accuracy but more complex setup and higher cost for this use case
- Custom ML model: Highest accuracy but requires training data and ML expertise

### 3. Express.js with TypeScript (over other frameworks)

**Choice:** Express.js with TypeScript on Node.js.
**Rationale:** Lightweight, widely supported, straightforward LINE SDK integration. TypeScript adds type safety for the data models (payment records, house data).
**Alternatives considered:**
- Fastify: Slightly faster but smaller ecosystem for LINE integrations
- NestJS: Too heavy for a single-webhook application

### 4. Single-service architecture (over microservices)

**Choice:** Monolithic Express server handling all concerns.
**Rationale:** The application has a simple request flow (webhook → verify → record → reply). Splitting into microservices adds latency and complexity with no benefit at this scale.

### 5. Railway/Render deployment (over serverless)

**Choice:** Simple container hosting on Railway or Render.
**Rationale:** Always-on server avoids cold start latency (critical for 5-second response target). Simple deployment via Git push. Free tier available.
**Alternatives considered:**
- AWS Lambda: Cold starts could exceed the 5-second target; more complex deployment
- Vercel: Good for Next.js but less natural for a pure Express webhook server

### 6. Project structure

```
src/
  index.ts              # Express server entry point
  config.ts             # Environment configuration
  line/
    webhook.ts          # LINE webhook handler
    messages.ts         # Flex Message builders
    richmenu.ts         # Rich Menu setup
  services/
    slip-verification.ts  # Claude Vision integration
    payment.ts            # Payment business logic
    sheets.ts             # Google Sheets operations
  types/
    index.ts            # Shared TypeScript types
```

## Risks / Trade-offs

- **[Google Sheets rate limits]** → Google Sheets API has a 60 requests/minute limit per user. For a village of ~300 houses, this is sufficient. If multiple residents submit simultaneously, requests are serialized. Mitigation: batch reads where possible, cache settings sheet data in memory.

- **[Claude Vision accuracy]** → AI extraction may misread amounts or dates on low-quality images. Mitigation: ask residents to confirm extracted data before recording; flag low-confidence extractions for manual review.

- **[5-second response deadline]** → Claude Vision API calls typically take 2-4 seconds. Combined with Google Sheets read/write, total may approach the limit. Mitigation: fire Google Sheets read (settings, duplicate check) in parallel with Claude Vision call where possible; reply with "processing" message first if needed.

- **[No backup for Google Sheets]** → If the sheet is accidentally deleted or corrupted, data is lost. Mitigation: enable Google Sheets version history; consider periodic export (future).

- **[LINE webhook retry]** → LINE retries webhook calls if no 200 response within ~1 second. Mitigation: respond with 200 immediately, process asynchronously, then use the LINE push message API to send results.

- **[Image URL expiration]** → LINE content API URLs expire. Mitigation: download the image content immediately on webhook receipt and store a reference (or re-upload to a persistent store if needed in future).
