## Context

The Lalin Village LINE bot handles common-area fee payments via slip verification (Gemini AI). The backend is Express + TypeScript with Google Sheets as the database. Currently deployed but non-functional because no resident has a `line_user_id` linked in the houses sheet — every interaction hits a dead-end error.

Key constraints:
- Target users include elderly residents → UI must be simple, buttons large, text clear
- Google Sheets is the only data store (no database migration)
- LINE Messaging API is the only channel
- Rich Menu images already exist (AI-generated via Gemini) but need resizing and compression to meet LINE requirements

## Goals / Non-Goals

**Goals:**
- Enable residents to self-register and link their LINE account to their house number
- Provide two distinct Rich Menu experiences (unregistered vs registered) with large, elderly-friendly buttons
- Resize and compress existing AI-generated Rich Menu images to LINE-compliant dimensions and file size
- Fix payment recording to handle multi-month payments and use correct date attribution
- Handle all webhook event types gracefully (follow, unfollow, unsupported messages)
- Provide AI prompts for generating Rich Menu images

**Non-Goals:**
- Admin dashboard changes (Phase 2 concern)
- Push notification / reminder system
- Multi-language support
- Rich Menu tab switching (evaluated and rejected — too complex for elderly users)
- Database migration away from Google Sheets

## Decisions

### 1. Registration State Management — In-Memory Map

**Decision**: Use a simple `Map<string, { step: string, timestamp: number }>` in memory for registration conversation state.

**Alternatives considered**:
- Google Sheets column for state → Too slow, unnecessary sheet writes for transient state
- Redis/external store → Over-engineered for a single-instance bot

**Rationale**: Registration is a 2-step flow (prompt → enter house number). State only needs to survive ~5 minutes. Server restart clears pending registrations which is acceptable — users just start over. Add TTL cleanup (15 min) to prevent memory leaks.

### 2. Rich Menu Strategy — Per-User Linking (No Tab Switch)

**Decision**: Create 2 Rich Menus. Set the "unregistered" menu as default. Link "registered" menu per-user upon successful registration.

**Alternatives considered**:
- Rich Menu Switch (tab UI) → Rejected: resets on chat reopen, adds cognitive load for elderly users
- Single Rich Menu for all → Current broken approach

**Rationale**: Per-user linking is persistent (survives chat close/reopen), simple (no alias management needed for MVP), and creates clear visual feedback that registration succeeded.

### 3. Rich Menu Image Size — 2500×1686 (Full Height)

**Decision**: Use full-height Rich Menus for registered users (4 large buttons in 2×2 grid). Unregistered uses 2500×843 with a single button.

**Rationale**: Larger touch targets for elderly users. Full height is the maximum LINE allows and gives the most button real estate.

### 3a. Rich Menu Image Processing — Resize + Compress on Build

**Decision**: Resize existing AI-generated images using `sips` (macOS) during implementation setup, then commit the processed images. If PNG exceeds 1MB after resize, convert to JPEG at quality 85%.

**Source images**:
- `Gemini_Generated_Image_hluv60hluv60hluv.png` (3552×1184, 5.4MB) → `richmenu-unregistered.png` (2500×843)
- `Gemini_Generated_Image_3p57i33p57i33p57.png` (2528×1696, 4.5MB) → `richmenu-registered.png` (2500×1686)

**Alternatives considered**:
- Runtime resize in Node.js → Unnecessary complexity; images are static assets
- Re-generate with correct dimensions → Existing images are good quality, just need resize

**Rationale**: LINE requires exact pixel dimensions (2500×843 or 2500×1686) and max 1MB file size. The existing Gemini-generated images are close but slightly off. One-time resize is the simplest approach.

### 4. Multi-Month Payment — Amount Divisible by Monthly Fee

**Decision**: Accept payments where `amount % monthly_fee === 0`. Calculate `monthCount = amount / monthly_fee`. Create separate payment records for each month, assigning to the earliest unpaid months.

**Alternatives considered**:
- Only accept exact monthly amount → Current behavior, too restrictive
- Accept any amount as partial payment → Complicates bookkeeping significantly

**Rationale**: Village residents sometimes pay 2-3 months at once. Dividing into per-month records keeps the payment history clean and outstanding balance calculation correct.

### 5. Payment Month Attribution — Use Earliest Unpaid Month, Not Slip Date

**Decision**: When recording a payment, assign it to the earliest unpaid month(s) for that house rather than using the current date or the date on the slip.

**Rationale**: A resident paying in March for an overdue February payment should have February marked as paid, not March. The slip date is the transfer date, not the billing period.

### 6. Rich Menu Cleanup — Delete All Before Recreating

**Decision**: On startup, call `getRichMenuList()`, delete all existing menus, then create fresh ones.

**Rationale**: Prevents Rich Menu accumulation across restarts. LINE allows max ~1000 menus. Clean slate avoids orphaned menus.

### 7. Duplicate House Registration Guard

**Decision**: If a house already has a `line_user_id` linked, reject the new registration attempt with a message to contact the village committee. Only unlinked houses can be registered.

**Rationale**: Prevents one person from hijacking another's registration. Admin can manually clear the `line_user_id` field if needed.

## Risks / Trade-offs

- **[In-memory registration state lost on restart]** → Acceptable: user simply retries. Registration is a 2-message flow.
- **[Rich Menu image quality depends on external AI tool]** → Mitigated: images already generated and visually verified. Only resize/compress needed.
- **[Gemini AI slip reading may misidentify amounts]** → Existing risk, not introduced by this change. Already has error handling.
- **[Delete-all-menus on startup briefly leaves users without a menu]** → Window is < 1 second. Acceptable for a village bot with ~100 users.
- **[Multi-month payment edge case: amount divisible but unreasonably large]** → Add cap: reject if monthCount > 12 (no one pays more than a year ahead).
