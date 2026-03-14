## 1. Project Setup

- [ ] 1.1 Create Next.js 14 project in dashboard/ with TypeScript and Tailwind CSS
- [ ] 1.2 Install dependencies: shadcn/ui, recharts, next-auth, googleapis
- [ ] 1.3 Create dashboard/.env.local with all environment variables
- [ ] 1.4 Add dashboard/.env.local to .gitignore
- [ ] 1.5 Configure Next.js to run on port 3001

## 2. Google Sheets Data Layer

- [ ] 2.1 Create lib/sheets.ts with Google Sheets auth and client setup
- [ ] 2.2 Implement getAllPayments, getPaymentsByFilter functions
- [ ] 2.3 Implement getAllHouses, addHouse, updateHouse functions
- [ ] 2.4 Implement getSettings, updateSettings functions
- [ ] 2.5 Implement getAdmins, addAdmin, removeAdmin, findAdminByEmail functions
- [ ] 2.6 Implement addPaymentRecord, updatePaymentStatus functions
- [ ] 2.7 Implement getOutstandingBalance calculation for all houses

## 3. Authentication

- [ ] 3.1 Configure NextAuth.js with Google OAuth provider
- [ ] 3.2 Implement admin whitelist check on sign-in (lookup admins sheet)
- [ ] 3.3 Create middleware to protect all routes
- [ ] 3.4 Create access-denied page for unauthorized users
- [ ] 3.5 Add role to session via NextAuth callbacks

## 4. Layout and Navigation

- [ ] 4.1 Create dashboard layout with sidebar navigation
- [ ] 4.2 Add sidebar links: Dashboard, Payments, Overdue, Houses, Settings
- [ ] 4.3 Add user info and sign-out button to sidebar
- [ ] 4.4 Make layout mobile-responsive with collapsible sidebar

## 5. Dashboard Overview Page

- [ ] 5.1 Create /dashboard page with 4 stat cards
- [ ] 5.2 Add monthly collection bar chart (Recharts)
- [ ] 5.3 Add paid vs unpaid donut chart (Recharts)
- [ ] 5.4 Add recent payments table (last 10)
- [ ] 5.5 Implement auto-refresh every 5 minutes

## 6. Payments Page

- [ ] 6.1 Create /payments page with full payment table
- [ ] 6.2 Add filters: month, year, house_number, verified_status
- [ ] 6.3 Add CSV export button
- [ ] 6.4 Add manual payment entry form (dialog)
- [ ] 6.5 Add verify/reject buttons for payment status updates

## 7. Overdue Page

- [ ] 7.1 Create /overdue page with overdue houses table
- [ ] 7.2 Sort by months overdue descending, highlight red for ≥3 months
- [ ] 7.3 Add "Send LINE reminder" button with push message API call

## 8. Houses Page

- [ ] 8.1 Create /houses page with houses table
- [ ] 8.2 Add new house form (dialog)
- [ ] 8.3 Add inline edit capability
- [ ] 8.4 Add active/inactive toggle

## 9. Settings Pages

- [ ] 9.1 Create /settings/admins page with admin list table
- [ ] 9.2 Add invite admin form and remove admin button (super_admin only)
- [ ] 9.3 Create /settings/line page with village settings form
- [ ] 9.4 Display LINE bot webhook URL and QR code link

## 10. Verification

- [ ] 10.1 Run npm install and npm run build to verify compilation
- [ ] 10.2 Run npm run dev and verify pages load correctly
