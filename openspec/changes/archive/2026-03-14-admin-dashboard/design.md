## Context

The existing Phase 1 system is a LINE chatbot (Express + TypeScript) that allows village residents to submit payment slips via LINE, which are verified by Gemini AI and recorded in Google Sheets. The admin dashboard is a separate Next.js application that reads/writes the same Google Sheets data to provide management capabilities.

The codebase structure:
- `src/` — LINE bot (Express, port 3000)
- `dashboard/` — Admin dashboard (Next.js, port 3001)
- Both share the same Google Sheets spreadsheet and service account

## Goals / Non-Goals

**Goals:**
- Provide a web-based admin interface for village committee members
- Reuse the same Google Sheets as the single source of truth
- Role-based access control via Google OAuth
- Mobile-responsive design using Tailwind CSS + shadcn/ui
- Independent deployment as a separate Render web service

**Non-Goals:**
- Migrating data away from Google Sheets to a database
- Modifying the existing LINE bot code
- Real-time WebSocket updates (polling every 5 minutes is sufficient)
- Multi-village/multi-tenant support
- Internationalization (Thai-only UI)

## Decisions

### 1. Separate Next.js project in `dashboard/`
**Decision**: Independent project with its own package.json, not a monorepo setup.
**Rationale**: Simplest approach — no build tooling changes to the existing bot, independent deployment on Render, clear separation of concerns.
**Alternative**: Monorepo with Turborepo — rejected as over-engineering for two small services.

### 2. Next.js App Router with Server Components
**Decision**: Use App Router with server-side data fetching via Google Sheets API.
**Rationale**: Server components keep Google credentials server-side, reduce client bundle, and simplify data fetching. API routes handle mutations.

### 3. Google Sheets as data layer (no ORM/DB)
**Decision**: Direct Google Sheets API calls via googleapis library, same pattern as Phase 1.
**Rationale**: Consistency with Phase 1, no migration needed, committee members can still view/edit sheets directly if needed.

### 4. NextAuth.js v4 with Google OAuth
**Decision**: Use NextAuth.js with Google provider, check admin whitelist in Google Sheets "admins" sheet.
**Rationale**: Simple setup, Google OAuth aligns with Google Sheets ecosystem, admin whitelist in sheets keeps everything in one place.

### 5. shadcn/ui component library
**Decision**: Use shadcn/ui (Radix-based) for UI components.
**Rationale**: Copy-paste components (no runtime dependency), Tailwind-native, highly customizable, good defaults for tables, forms, and dialogs.

### 6. Client-side polling for auto-refresh
**Decision**: SWR or manual setInterval for dashboard auto-refresh every 5 minutes.
**Rationale**: Simple, no WebSocket infrastructure needed, Google Sheets API rate limits make real-time impractical anyway.

## Risks / Trade-offs

- **[Google Sheets API rate limits]** → Dashboard fetches data on each page load; heavy usage could hit quota. Mitigation: server-side caching with revalidation intervals.
- **[Admin sheet as auth store]** → Not a proper auth database. Mitigation: Acceptable for small village scale (<50 admins); can migrate later if needed.
- **[Shared credentials]** → Dashboard uses same service account as bot. Mitigation: Read/write scope is already granted; dashboard needs same access level.
- **[No offline/write conflict handling]** → Two admins editing same payment simultaneously could conflict. Mitigation: Google Sheets handles last-write-wins; acceptable at this scale.
