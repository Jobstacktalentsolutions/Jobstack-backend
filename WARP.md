# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Monorepo using NestJS (TypeScript) with two applications and shared libraries.
- Apps: apps/api (HTTP API) and apps/background (background/queue workers).
- Libs: libs/common (database, redis, logging, storage, shared utilities) and libs/seeding (database seeding toolkit).
- Persistence: PostgreSQL via TypeORM; migrations configured in typeorm.config.ts; entities live under libs/common/src/database/entities.
- Caching/queues: Redis (ioredis) and Bull (via @nestjs/bull) for asynchronous jobs.
- Notifications: Templated emails (EJS) with providers (Brevo, Resend) and queue processing.
- Storage: S3-compatible iDrive e2 through AWS SDK clients, tracked with a Document entity.

Setup
- Package manager: pnpm (pnpm-lock.yaml present).
- Environment: copy .env.example to .env and fill values. Critical keys: DATABASE_URL, REDIS_URL (or REDIS_HOST/PORT if module requires), JWT_* (HS256 or RS256), BREVO_*, RESEND_*, COMPANY_*, WEBSITE_URL, IDRIVE_* (endpoint, region, access keys, bucket names), SUPER_ADMIN_* (optional for seeding).
- Path aliases: TypeScript paths map @app/common and @app/seeding; Jest is configured to resolve these.

Common commands
- Install deps
  - pnpm install
- Develop (API)
  - pnpm dev            # nest start --watch for apps/api
  - pnpm start         # same as above without watch
- Develop (Background)
  - pnpm nest start background --watch
- Build
  - pnpm build         # builds default project (apps/api)
  - pnpm nest build api
  - pnpm nest build background
- Run (prod)
  - pnpm start:prod    # runs dist/apps/api/main (after build)
  - node dist/apps/background/main
- Lint/format
  - pnpm lint
  - pnpm format
- Tests (Jest, ts-jest)
  - pnpm test                  # run all *.spec.ts in apps/ and libs/
  - pnpm test:watch
  - pnpm test:cov
  - pnpm jest apps/common/src/common.service.spec.ts    # run a single test file
  - pnpm jest -t "regex or test name"                   # run tests by name/pattern
- Database (TypeORM; requires DATABASE_URL in .env)
  - pnpm db:generate            # generate migration into ./migrations/
  - pnpm db:migrate             # run pending migrations
  - pnpm db:revert              # revert last migration
  - pnpm db:show                # list migrations
  - pnpm db:create              # create empty migration file
  - pnpm db:sync                # schema sync (non-prod only)
- Seeding (see libs/seeding/README.md)
  - pnpm ts-node -r tsconfig-paths/register libs/seeding/src/lib/scripts/seed.ts permissions roles admins
  - pnpm ts-node -r tsconfig-paths/register libs/seeding/src/lib/scripts/seed.ts skills
  - To use tsx instead: add devDependency "tsx" and run: pnpm tsx libs/seeding/src/lib/scripts/seed.ts [entities]

Big-picture architecture
- API application (apps/api)
  - Entry: apps/api/src/main.ts
    - Global ValidationPipe (whitelist + forbidNonWhitelisted)
    - Global prefix: /api
    - Logger: nestjs-pino (pretty transport)
    - Port from ENV.PORT (binds 0.0.0.0 for hosting compatibility)
  - Composition: ApiModule imports ConfigModule, LoggerModule (from @app/common), CommonModule, NotificationModule, SkillsModule, AuthModule, UserModule, and Pino LoggerModule.
  - Templates: EJS email templates under apps/api/src/templates/emails.
- Background application (apps/background)
  - Entry: apps/background/src/main.ts; uses ConfigService for PORT and nestjs-pino for logging.
- Common library (libs/common)
  - DatabaseModule: TypeORM Postgres via ENV.DATABASE_URL; entities autoloaded; synchronize disabled by default. Exports typeOrmConfig for CLI usage.
  - RedisModule: Global ioredis client provider using ENV.REDIS_URL and optional ENV.REDIS_KEY_PREFIX with guarded retries and connection logs.
  - Logger, shared decorators/interceptors, DTOs, enums, exceptions, and utilities; S3-compatible storage module with provider abstraction and Document entity.
- Seeding library (libs/seeding)
  - Idempotent seeding for permissions → roles → admins → skills. Provides CLI script and a SeedingService for programmatic use. Supports SUPER_ADMIN_* overrides via env.
- Configuration
  - Centralized env keys in apps/api/src/modules/config/env.config.ts (ENV enum) to avoid stringly-typed env access.
  - Global TS path aliases ensure shared libs are imported as @app/common and @app/seeding across apps, with matching Jest mappings.

Notes for future changes
- When adding modules, follow the existing NestJS modular structure (module/service/controller) and prefer placing cross-cutting concerns into libs/common.
- Migrations should reflect entity changes under libs/common/src/database/entities; run db:generate and review output before applying.
- Ensure Redis and DATABASE_URL are set for any features touching queues or persistence before running background jobs or notifications.

Project rules (from .cursor/rules)
- Architecture: keep business concerns (Auth, Vetting, Roles, Payment) modular and isolated; use RBAC for Admin, Recruiter, JobSeeker.
- Tech focus: PostgreSQL with TypeORM and migrations; Bull/Redis for background processing (e.g., matching engine); Brevo for email; iDrive e2 for storage; structured logging via Pino.
- Env usage: access variables via the ENV enum defined in env.config.ts.
- Conventions: adhere to current folder structure and naming; add concise comments only for non-obvious logic; log via Pino; when creating a new module, include a README in that module’s folder.
- Branching: main (prod), develop (integration), feature/[name] for work branches.

References
- Root config files: package.json (scripts, jest), nest-cli.json (projects), tsconfig.json (paths), tsconfig.build.json, eslint.config.mjs, typeorm.config.ts, .env.example.
- Module-specific documentation: apps/api/src/modules/notification/README.md, libs/common/src/storage/README.md, libs/seeding/README.md.
