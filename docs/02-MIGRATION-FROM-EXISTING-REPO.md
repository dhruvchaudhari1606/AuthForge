# AuthForge --- Migration From Existing Repository

## 1. Objective

AuthForge must be created from the existing NestJS + TypeORM repository
without an unnecessary rewrite.

The migration goal is:

> **Reuse stable infrastructure, remove unrelated product functionality,
> refactor where boundaries are unclear, and add the missing
> identity/security modules.**

Do not create a second competing architecture beside the existing one.

## 2. Existing Repository

The starting repository contains:

``` text
src/
├── apps/mail-worker/
├── common/
├── config/
├── database/
├── i18n/
├── modules/
│   ├── auth/
│   ├── billing/
│   ├── files/
│   ├── health/
│   ├── mail/
│   ├── password-reset/
│   ├── payments/
│   ├── plans/
│   ├── socket/
│   ├── stripe/
│   ├── subscriptions/
│   └── users/
└── ...
```

It already contains TypeORM entities for users, sessions, plans,
payments and subscriptions.

## 3. Migration Matrix

  -----------------------------------------------------------------------
  Existing Area           Action                  Reason
  ----------------------- ----------------------- -----------------------
  `common/`               Keep/adapt              Cross-cutting
                                                  infrastructure

  `config/`               Keep/adapt              Central configuration

  `database/`             Keep/adapt              TypeORM foundation

  `auth/`                 Refactor                Core AuthForge

  `users/`                Keep/adapt              Identity

  `password-reset/`       Keep/adapt              V1 requirement

  `mail/`                 Keep/adapt              Verification/reset
                                                  emails

  `health/`               Keep/adapt              Operational readiness

  `billing/`              Remove                  Outside V1

  `payments/`             Remove                  Outside V1

  `plans/`                Remove                  Outside V1

  `stripe/`               Remove                  Outside V1

  `subscriptions/`        Remove                  Outside V1

  `files/`                Remove                  Outside V1

  `socket/`               Remove                  Not needed for V1

  `i18n/`                 Review/remove           Keep only if already
                                                  required

  `mail-worker/`          Optional                Keep only if queue
                                                  architecture is
                                                  actually used
  -----------------------------------------------------------------------

## 4. New Modules

Create:

``` text
authorization/
audit/
email-verification/
sessions/
```

These should have clear module boundaries.

## 5. Database Cleanup

Remove unrelated entities:

``` text
payment
plan
plan-price
subscription
stripe-event
```

Retain/adapt:

``` text
base
user
session
role
permission
user-role
role-permission
password-reset
email-verification
audit-log
```

If an existing session entity already contains the required fields,
migrate it rather than creating a duplicate.

## 6. Dependency Cleanup

Review `package.json`.

Remove packages that are used only by deleted features. Typical examples
may include:

-   Stripe SDK
-   file-storage SDKs
-   socket packages
-   billing-only utilities

Do not blindly remove packages. Search imports first.

Required V1 categories include:

-   NestJS
-   TypeORM/PostgreSQL driver
-   JWT
-   password hashing
-   validation
-   Redis client/rate limiting
-   cookie handling
-   Swagger
-   testing
-   security headers
-   logging/Sentry as appropriate

## 7. Configuration Migration

Consolidate configuration into:

``` text
src/config/
```

Expected configuration areas:

-   application
-   database
-   JWT
-   Redis
-   mail
-   CORS
-   security
-   Swagger
-   Sentry

All secrets must come from environment variables.

## 8. Environment Variables

At minimum document:

``` env
NODE_ENV=
PORT=

DATABASE_HOST=
DATABASE_PORT=
DATABASE_NAME=
DATABASE_USER=
DATABASE_PASSWORD=

REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=

COOKIE_SECURE=
COOKIE_DOMAIN=
COOKIE_SAME_SITE=

CORS_ORIGINS=

MAIL_PROVIDER=
MAIL_FROM=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

APP_URL=
FRONTEND_URL=
```

Use the existing configuration naming convention where practical.

## 9. Migration Order

### Step 1 --- Inspect

Before changing code:

-   inspect modules
-   inspect imports
-   inspect entities
-   inspect migrations
-   inspect package dependencies
-   inspect tests
-   inspect Docker
-   inspect environment validation

### Step 2 --- Remove Product-Specific Modules

Remove billing/payment/subscription/Stripe/files/socket code after
confirming no remaining imports.

### Step 3 --- Normalize Database

Create the AuthForge entity set and migrations.

### Step 4 --- Refactor Authentication

Keep stable auth code but make session/token responsibilities explicit.

### Step 5 --- Add Sessions

Move session lifecycle logic into the Sessions module.

### Step 6 --- Add Authorization

Add roles, permissions and guards.

### Step 7 --- Add Verification/Recovery

Add email verification and password recovery.

### Step 8 --- Add Audit

Record security-sensitive events.

### Step 9 --- Update Tests

Delete irrelevant tests and add AuthForge coverage.

### Step 10 --- Validate

Run:

``` bash
npm run lint
npm run test
npm run test:e2e
npm run build
docker compose up --build
```

## 10. Migration Safety Rules

-   Never delete an entity without checking dependencies.
-   Never change database schema manually without a migration.
-   Never replace working authentication code simply for stylistic
    reasons.
-   Never copy Prisma patterns into the TypeORM codebase.
-   Never introduce a second repository abstraction without a reason.
-   Keep commits small enough to review.
-   Run tests after each major migration phase.

## 11. Recommended Commit Sequence

``` text
chore: prepare authforge migration
refactor: remove unrelated billing modules
refactor: remove payment and subscription modules
refactor: normalize authentication module
feat: add authforge session management
feat: add authorization and rbac
feat: add email verification
feat: add password recovery
feat: add audit logging
test: add authentication e2e coverage
chore: finalize docker and ci
docs: finalize authforge documentation
```

## 12. Definition of Done

Migration is complete when:

-   the application builds
-   no removed module is referenced
-   TypeORM remains the ORM
-   migrations create a clean AuthForge database
-   registration/login/refresh/logout work
-   sessions work
-   RBAC works
-   password recovery works
-   email verification works
-   tests pass
-   Docker starts successfully
-   documentation matches the code
