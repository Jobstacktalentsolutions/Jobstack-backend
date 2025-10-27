# JobStack Seeding - Quick Guide

A comprehensive seeding system for JobStack backend that handles permissions, roles, admin profiles, and skills with idempotent operations.

## Quick Start

### Run specific entities:

```bash
# Seed individual entities
pnpm db:seed -- permissions
pnpm db:seed -- roles
pnpm db:seed -- admins
pnpm db:seed -- skills

# Seed multiple entities
pnpm db:seed -- permissions roles admins
```

### Run full system initialization (recommended):

```bash
# Seed all system essentials (permissions → roles → admins)
pnpm db:seed -- permissions roles admins

# Seed everything including skills
pnpm db:seed
```

### Available Entities:

- `permissions` - System permissions for RBAC
- `roles` - Admin roles (super_admin, admin, vetting_admin, payment_admin)
- `admins` - Admin profiles with role assignments
- `skills` - Job skills for the Nigerian market

## Super Admin Configuration

Set environment variables before seeding or app start (optional):

```bash
SUPER_ADMIN_EMAIL=admin@yourcompany.com
SUPER_ADMIN_PASSWORD=your-secure-password
SUPER_ADMIN_FIRST_NAME=Your
SUPER_ADMIN_LAST_NAME=Name
```

**Defaults:**

- Email: `superadmin@jobstack.ng`
- Password: `admin123`
- Name: `Super Admin`

## Features

### ✅ Safe Operations

- **Idempotent upserts**: Re-runs are safe; existing records are updated by static IDs
- **No truncation**: Existing data is preserved using smart upsert logic
- **Dependency handling**: Entities are seeded in the correct order automatically

### ✅ Flexible Usage

- Seed any subset of entities in any order
- Dependencies are handled internally (e.g., roles need permissions first)
- Environment-based super admin configuration

### ✅ Comprehensive Data

- **22 system permissions** covering all JobStack operations
- **4 predefined roles** with appropriate permission sets
- **4 admin profiles** including super admin
- **22 skills** relevant to the Nigerian job market

## Entity Details

### Permissions

Core permissions for JobStack RBAC system:

- Admin Management (create, read, update, delete)
- Recruiter Management (create, read, update, delete)
- Jobseeker Management (create, read, update, delete)
- Vetting Operations (view, update)
- Job Management (create, read, update, delete, match)
- Payment Operations (view, refund)
- Notifications (send)

### Roles

Pre-configured roles with permission sets:

- **Super Admin**: All permissions
- **Admin**: Most permissions except system-critical ones
- **Vetting Admin**: Focused on jobseeker vetting and talent management
- **Payment Admin**: Focused on payment and financial operations

### Admin Profiles

Default admin accounts:

- **Super Admin**: Configurable via environment variables
- **General Admin**: `admin@jobstack.ng`
- **Vetting Manager**: `vetting@jobstack.ng`
- **Payment Admin**: `payments@jobstack.ng`

### Skills

22 relevant skills for the Nigerian job market:

- Technical: JavaScript, Python, React, TypeScript, Node.js
- Database: PostgreSQL, MySQL, MongoDB
- Business: Project Management, Digital Marketing, Data Analysis
- Design: UI/UX Design, Graphic Design
- Finance: Accounting, Financial Analysis
- Sales: Sales, Content Marketing
- Operations: Operations Management, Supply Chain
- Communication: Communication, English Language

## Integration with Your App

### Using the Seeding Service

```typescript
import { DataSource } from 'typeorm';
import { SeedingService } from '@app/seeding';

// In your application startup
const dataSource = new DataSource(typeormConfig);
await dataSource.initialize();

const seedingService = new SeedingService(dataSource);

// Seed system essentials on app startup
await seedingService.seedSystemEssentials();

// Or seed specific entities
await seedingService.runEntities(['permissions', 'roles']);
```

### Database Initialization Hook

Add to your main application startup:

```typescript
// Ensure super admin exists on every app start
const seedingService = new SeedingService(dataSource);
if (!(await seedingService.isDatabaseReady())) {
  throw new Error('Database not ready');
}

// Safe to run on every startup - idempotent
await seedingService.seedSystemEssentials();
```

## Challenges & Solutions (Lessons Learned)

### ✅ Foreign Key Dependencies

**Challenge**: Roles need permissions, admins need roles
**Solution**: Automatic dependency resolution in seeding order

### ✅ Unique Constraint Violations

**Challenge**: Re-running seeds caused duplicate key errors
**Solution**: Smart upsert using unique fields (email, name, key)

### ✅ Environment Configuration

**Challenge**: Different super admin credentials per environment
**Solution**: Environment variable support with sensible defaults

### ✅ Data Consistency

**Challenge**: Keeping seed data in sync with entity changes
**Solution**: Static UUIDs and comprehensive validation

### ✅ Safe Re-runs

**Challenge**: Avoiding data loss during re-seeding
**Solution**: Upsert-only operations, no truncation

## File Structure

```
libs/seeding/
├── src/
│   ├── lib/
│   │   ├── data/           # Static seed data
│   │   │   ├── permissions.data.ts
│   │   │   ├── roles.data.ts
│   │   │   ├── admins.data.ts
│   │   │   └── skills.data.ts
│   │   ├── factories/      # Entity factories
│   │   │   ├── base.factory.ts
│   │   │   ├── permission.factory.ts
│   │   │   ├── role.factory.ts
│   │   │   ├── admin.factory.ts
│   │   │   └── skill.factory.ts
│   │   ├── interfaces/     # TypeScript interfaces
│   │   ├── seeders/        # Seeding orchestration
│   │   ├── scripts/        # CLI scripts
│   │   ├── utils/          # Helper utilities
│   │   └── seeding.service.ts
│   └── index.ts
└── README.md
```

## Best Practices

1. **Always seed system essentials first**: `permissions → roles → admins`
2. **Use environment variables** for production super admin credentials
3. **Run seeding on app startup** to ensure system consistency
4. **Don't modify static UUIDs** in seed data files
5. **Test seeding scripts** in development before production deployment

## Troubleshooting

### Database Connection Issues

```bash
# Ensure your database is running and accessible
# Check your TypeORM configuration in libs/common/src/database/typeorm.config.ts
```

### Permission Errors

```bash
# Ensure the database user has CREATE, INSERT, UPDATE permissions
# Check that all required tables exist (run migrations first)
```

### Missing Dependencies

```bash
# Install required dependencies
pnpm install bcrypt @types/bcrypt tsx

# Ensure TypeORM entities are properly imported
```

### Environment Variables

```bash
# For production, always set:
export SUPER_ADMIN_EMAIL=your-admin@company.com
export SUPER_ADMIN_PASSWORD=your-secure-password
```

---

**Note**: This seeding system is designed to be run safely multiple times. All operations are idempotent and will not cause data loss or duplication.
