## ADDED Requirements

### Requirement: Google OAuth login
The system SHALL authenticate users via Google OAuth using NextAuth.js. Only users whose email exists in the "admins" Google Sheet SHALL be granted access.

#### Scenario: Successful admin login
- **WHEN** a user logs in with Google OAuth and their email exists in the "admins" sheet
- **THEN** the system grants access and redirects to the dashboard

#### Scenario: Unauthorized user login
- **WHEN** a user logs in with Google OAuth but their email is NOT in the "admins" sheet
- **THEN** the system displays an "Access Denied" page

#### Scenario: Unauthenticated access
- **WHEN** a user navigates to any page without being logged in
- **THEN** the system redirects to the Google OAuth login page

### Requirement: Role-based access control
The system SHALL enforce role-based access using roles stored in the "admins" sheet: super_admin, admin, viewer.

#### Scenario: Super admin access
- **WHEN** a user with role "super_admin" is logged in
- **THEN** they SHALL have access to all pages including admin management

#### Scenario: Viewer access restriction
- **WHEN** a user with role "viewer" is logged in
- **THEN** they SHALL only have read access to dashboard, payments, overdue, and houses pages

### Requirement: Admins sheet structure
The system SHALL use a Google Sheet named "admins" with columns: email, role, added_date, added_by.

#### Scenario: Admin lookup on login
- **WHEN** a user authenticates via Google OAuth
- **THEN** the system reads the "admins" sheet to find a row matching the user's email
