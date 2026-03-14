## Why

The Phase 1 LINE bot handles resident-facing payment submission and slip verification, but village administrators have no way to view overall payment status, manage houses, track overdue payments, or configure settings without directly editing Google Sheets. An admin dashboard provides a web-based management interface for village committee members.

## What Changes

- Add a new Next.js web application in `dashboard/` directory (separate from the LINE bot in `src/`)
- Google OAuth login restricted to authorized admin emails stored in a new "admins" sheet
- Dashboard overview with payment statistics and charts
- Payment management page with filtering, CSV export, manual entry, and status updates
- Overdue tracking page with LINE reminder integration
- House management with CRUD operations
- Settings management for village config and admin user management
- Role-based access control (super_admin, admin, viewer)

## Capabilities

### New Capabilities
- `admin-auth`: Google OAuth authentication with role-based access control via NextAuth.js, admin whitelist in Google Sheets "admins" sheet
- `dashboard-overview`: Statistics cards, monthly collection charts, payment status donut chart, recent transactions table with auto-refresh
- `payment-management`: Payment listing with filters, CSV export, manual payment entry, verify/reject payment status updates
- `overdue-tracking`: Overdue house listing sorted by severity, red highlighting for 3+ months overdue, LINE push message reminders
- `house-management`: CRUD operations for house records in Google Sheets, active/inactive toggle
- `admin-settings`: Admin user management (invite/remove by email), village settings editor, LINE bot info display

### Modified Capabilities

## Impact

- New `dashboard/` directory added as independent Next.js project (does not affect existing `src/` bot code)
- New "admins" sheet added to existing Google Spreadsheet
- Same Google Sheets service account credentials shared between bot and dashboard
- LINE Channel Access Token shared for push message functionality in overdue reminders
- Runs on separate port (3001) from the LINE bot (3000)
