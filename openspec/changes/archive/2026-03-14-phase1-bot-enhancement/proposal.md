## Why

The LINE bot is currently non-functional for all users. The Google Sheets `houses` table has no `line_user_id` values populated, creating a dead-end where every user receives "ไม่พบข้อมูลบ้านของคุณในระบบ" regardless of what they send. There is no self-registration flow, no welcome message on follow, and the Rich Menu recreates on every server restart without cleanup. These issues must be fixed before the bot can serve any village resident — especially elderly users who need a simple, clear UI.

## What Changes

- **Rich Menu overhaul**: Replace single Rich Menu with 2-segment system (unregistered/registered), clean up old menus before creating new ones, use large buttons (2500×1686) optimized for elderly users
- **Registration flow**: Allow residents to self-register by entering their house number, which links their LINE userId to the houses sheet
- **Follow/Unfollow event handling**: Send welcome message when user adds the bot as friend, log when user blocks
- **Unsupported message type handling**: Respond with friendly message for sticker, video, audio, file, location instead of silent ignore
- **Payment logic fixes**: Support multi-month combined payments, use slip date for month/year assignment instead of current date, check for duplicate payment in same month
- **Rich Menu image processing**: Resize and compress the 2 existing AI-generated Rich Menu images (from `assets/`) to LINE's exact required dimensions and <1MB file size limit

## Capabilities

### New Capabilities
- `rich-menu-segmented`: Two-segment Rich Menu system with unregistered (single "register" button) and registered (4-button grid) menus, cleanup of old menus, per-user linking
- `user-registration`: Self-service house registration flow — user enters house number, bot validates against houses sheet, links LINE userId, switches Rich Menu
- `rich-menu-image-processing`: Resize/compress the 2 existing AI-generated Rich Menu images to LINE-required dimensions (2500×843 / 2500×1686) and under 1MB file size, rename to standardized filenames

### Modified Capabilities
- `line-webhook`: Add follow/unfollow event handling, unsupported message type responses, registration conversation state management
- `payment-recording`: Support multi-month combined payments (amount = N × monthly_fee), use slip date for month/year, duplicate month detection
- `slip-verification`: Relax amount check to accept multiples of monthly_fee (not just exact match)

## Impact

- **Files modified**: `src/line/richmenu.ts`, `src/line/webhook.ts`, `src/line/messages.ts`, `src/services/sheets.ts`, `src/services/slip-verification.ts`, `src/types/index.ts`
- **Assets**: Resize existing `Gemini_Generated_Image_hluv60hluv60hluv.png` (3552×1184, 5.4MB) → `richmenu-unregistered.png` (2500×843, <1MB) and `Gemini_Generated_Image_3p57i33p57i33p57.png` (2528×1696, 4.5MB) → `richmenu-registered.png` (2500×1686, <1MB)
- **Google Sheets**: Column C (`line_user_id`) in houses sheet will be written to during registration
- **LINE API**: Additional API calls for per-user menu linking (no alias management needed — using per-user linking only)
- **State management**: Need simple in-memory or sheet-based state for registration conversation flow
