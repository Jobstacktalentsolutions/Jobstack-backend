# User Management - Backend Conceptual Documentation

## Feature Overview

**What problem this feature solves:**

- Enables platform administrators to maintain account quality and security by managing user accounts
- Provides oversight for employer verification processes
- Controls administrative access through role-based permissions

**Who it affects:**

- **Admins** (with USER_MANAGEMENT role or higher): Can view, suspend, and unsuspend Employer and Jobseeker accounts
- **SUPER_ADMIN**: Can additionally create, delete, and suspend other admin accounts
- **Employers**: Subject to verification approval/rejection and account suspension
- **Jobseekers**: Subject to account suspension

## Backend Flow (Mental Model)

### Viewing Users

1. Admin requests a list of users (employers or jobseekers)
2. Backend verifies admin authentication and role permissions
3. System retrieves user data with related information (profiles, verification status)
4. Results are filtered, sorted, and paginated before returning

### Suspending a User Account

1. Admin initiates suspension action
2. Backend checks: admin has USER_MANAGEMENT role, target account exists, account is not already suspended
3. System updates account status: sets `suspended = true`, records timestamp and optional reason
4. Email notification is automatically sent to the suspended user
5. Suspended accounts are blocked from logging in or performing actions

### Unsuspending a User Account

1. Admin initiates unsuspension action
2. Backend checks: admin has USER_MANAGEMENT role, target account exists, account is currently suspended
3. System clears suspension: sets `suspended = false`, removes timestamp and reason
4. Email notification confirms account reinstatement
5. User can now log in and use the platform normally

### Approving/Rejecting Employer Verification

1. Admin reviews employer verification documents
2. Admin makes decision (approve or reject)
3. Backend updates verification status and records review timestamp
4. If rejected, reason is stored for the employer to see
5. Employer receives notification of the decision

### Creating an Admin Account

1. Admin with USER_MANAGEMENT role initiates creation
2. Backend validates: creator's privilege level, new admin's role is valid, email is unique
3. System enforces rule: creator can only assign roles with same or lower privilege level
4. Random password is generated and hashed
5. Admin account and profile are created with assigned role
6. Credentials are emailed to the new admin

### Deleting an Admin Account

1. SUPER_ADMIN initiates deletion
2. Backend checks: requester is SUPER_ADMIN, target exists, requester is not deleting themselves
3. System permanently removes the admin account and associated profile
4. Deletion is irreversible

## States the Backend Can Be In

### Account States

- **Active**: Account is operational, user can log in and perform actions
- **Suspended**: Account is temporarily disabled, login blocked, actions prevented
  - Includes timestamp of suspension and optional reason

### Employer Verification States

- **NOT_STARTED**: Employer hasn't submitted verification documents
- **PENDING**: Documents submitted, awaiting admin review
- **APPROVED**: Verification documents accepted, employer is verified
- **REJECTED**: Verification documents declined, reason provided

### Admin Role States

- **SUPER_ADMIN**: Full privileges (level 3), can manage all admins
- **USER_MANAGEMENT**: Elevated privileges (level 2), can manage users
- **CONTENT_MODERATION**: Elevated privileges (level 2), content oversight
- **ANALYTICS**: Basic privileges (level 1), view-only access

## Key Backend Decisions & Rules

### Permission Hierarchy

- Privilege levels are numeric: BASIC (1) < ELEVATED (2) < FULL (3)
- Admins with higher privilege levels can perform actions requiring lower levels
- Role-specific checks: USER_MANAGEMENT role required for user suspension
- SUPER_ADMIN role required for admin deletion

### Self-Protection Rules

- Admins cannot suspend or delete their own accounts
- Prevents accidental lockout and maintains system security

### Admin Creation Constraints

- Admins can only create other admins with same or lower privilege level
- Prevents privilege escalation
- Email addresses must be unique across all admin accounts

### Suspension Logic

- Cannot suspend an already suspended account (returns error)
- Cannot unsuspend an active account (returns error)
- Suspension reason is optional but recommended for audit trail
- Email notifications are sent automatically on state changes

### Verification Workflow

- Only one verification status can exist at a time
- Rejection requires a reason to be provided
- Review timestamp is automatically recorded

## UI/UX Implications

### Loading States

- Account lists may take time to load (pagination, filtering, sorting)
- Suspension/unsuspension actions trigger email sending (may take 1-2 seconds)
- Admin creation involves password generation and email delivery

### Empty States

- No users found (filtered results)
- No admins exist (initial system state)
- No verification requests pending

### Success States

- User suspended: account immediately becomes inactive
- User unsuspended: account immediately becomes active
- Admin created: credentials sent via email (user may not have access yet)
- Verification approved: employer gains verified status

### Error States

- Permission denied: admin lacks required role
- Already suspended: attempting to suspend an already suspended account
- Not suspended: attempting to unsuspend an active account
- Cannot delete self: SUPER_ADMIN trying to delete their own account
- User not found: target account doesn't exist
- Email conflict: creating admin with existing email

### Restricted States

- Non-SUPER_ADMIN admins cannot see delete options for other admins
- Admins without USER_MANAGEMENT role cannot see suspend/unsuspend actions
- Lower privilege admins cannot create higher privilege admins (UI should hide these options)

### Real-time Considerations

- Account status changes are immediate (no polling needed for basic updates)
- Email notifications are asynchronous (user may receive email after UI update)
- Suspended users should see clear messaging about their account status
