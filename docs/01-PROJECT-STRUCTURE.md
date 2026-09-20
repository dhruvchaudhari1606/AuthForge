# AuthForge --- Project Structure

## 1. Purpose

AuthForge is a production-oriented authentication and identity service
built with **NestJS, TypeScript, PostgreSQL, TypeORM, Redis and JWT**.
It is designed as a reusable portfolio-quality backend rather than a
tutorial CRUD application.

The architecture must reuse the existing NestJS + TypeORM repository
where practical. **Prisma is intentionally not part of AuthForge.**

The project should demonstrate:

-   modular NestJS architecture
-   secure authentication
-   refresh-token rotation and reuse detection
-   multi-device session management
-   RBAC and permissions
-   email verification and password recovery
-   PostgreSQL persistence
-   Redis for short-lived/security state
-   Dockerized local infrastructure
-   Swagger/OpenAPI
-   automated testing
-   CI/CD
-   centralized logging and error handling

## 2. Target Repository

``` text
authforge/
├── .github/
│   └── workflows/
├── .husky/
│   └── pre-commit
├── docs/
│   ├── 01-PROJECT-STRUCTURE.md
│   ├── 02-MIGRATION-FROM-EXISTING-REPO.md
│   ├── 03-IMPLEMENTATION-PLAN.md
│   ├── 04-DATABASE-DESIGN.md
│   ├── 05-AUTHENTICATION-FLOW.md
│   ├── 06-SESSION-MANAGEMENT.md
│   ├── 07-AUTHORIZATION-RBAC.md
│   ├── 08-SECURITY-PLAN.md
│   ├── 09-MAIL-AND-VERIFICATION.md
│   ├── 10-TESTING-PLAN.md
│   ├── 11-DOCKER-AND-INFRASTRUCTURE.md
│   ├── 12-CI-CD-PLAN.md
│   ├── 13-API-DOCUMENTATION-PLAN.md
│   └── 14-README-CHECKLIST.md
├── src/
│   ├── apps/
│   │   └── mail-worker/                 # Optional; only if queue processing is retained
│   ├── common/
│   │   ├── constants/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── exceptions/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── logger/
│   │   ├── middleware/
│   │   └── utils/
│   ├── config/
│   │   ├── configuration.ts
│   │   ├── database.config.ts
│   │   ├── env-validation.ts
│   │   ├── jwt.config.ts
│   │   ├── sentry.config.ts
│   │   └── swagger.config.ts
│   ├── database/
│   │   ├── entities/
│   │   ├── migrations/
│   │   ├── seeders/
│   │   ├── data-source.ts
│   │   └── seed.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── authorization/
│   │   ├── audit/
│   │   ├── email-verification/
│   │   ├── health/
│   │   ├── mail/
│   │   ├── password-reset/
│   │   ├── sessions/
│   │   └── users/
│   ├── i18n/                            # Optional; omit for V1 unless required
│   ├── templates/
│   ├── types/
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── e2e/
│   ├── fixtures/
│   ├── integration/
│   └── jest.setup.ts
├── .dockerignore
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── eslint.config.mjs
├── jest.config.ts
├── nest-cli.json
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.build.json
└── tsconfig.json
```

## 3. Module Responsibilities

### Auth

Orchestrates authentication use cases:

-   registration
-   login
-   access-token validation
-   refresh
-   logout
-   logout-all
-   password change integration
-   authentication guards/strategies

Auth should not directly own every persistence concern.

### Users

Owns user identity/profile operations:

-   current user
-   profile update
-   user status
-   account metadata

### Sessions

Owns session persistence and lifecycle:

-   create session
-   rotate refresh token
-   revoke session
-   revoke all sessions
-   list sessions
-   detect refresh-token reuse

### Authorization

Owns:

-   roles
-   permissions
-   role/permission relationships
-   decorators
-   guards
-   authorization service
-   administrative authorization

### Password Reset

Owns reset-token lifecycle and password recovery state.

### Email Verification

Owns verification-token lifecycle and verification state.

### Mail

Provides a provider abstraction and templates. Auth modules should call
the mail service rather than instantiate Nodemailer/SendGrid directly.

### Audit

Owns security/business audit events such as login, logout, password
change, role changes and suspicious token reuse.

### Health

Provides health/readiness endpoints for PostgreSQL, Redis and
application state.

## 4. Common Layer

Only genuinely cross-cutting functionality belongs under `common`.

Examples:

-   request ID
-   shared decorators
-   validation helpers
-   exception types
-   global filters
-   logging
-   middleware
-   generic utilities

Do not place AuthForge-specific authorization logic in `common` simply
because it is used by multiple modules.

## 5. Database Layer

TypeORM entities live in:

``` text
src/database/entities/
```

Core entities:

-   `user.entity.ts`
-   `session.entity.ts`
-   `role.entity.ts`
-   `permission.entity.ts`
-   `user-role.entity.ts`
-   `role-permission.entity.ts`
-   `password-reset.entity.ts`
-   `email-verification.entity.ts`
-   `audit-log.entity.ts`
-   `base.entity.ts`

Migrations are the source of truth for schema evolution. `synchronize`
must not be enabled in production.

## 6. Dependency Direction

Preferred dependency direction:

``` text
Controller
   ↓
Application/Service
   ↓
Repository/Data Access
   ↓
TypeORM
   ↓
PostgreSQL
```

Cross-cutting services such as Redis, Mail, Audit and Logger are
injected through clear module boundaries.

Controllers must not contain SQL, TypeORM query-builder logic, password
hashing or token rotation algorithms.

## 7. Existing Repository Strategy

Reuse the mature repository structure instead of rebuilding NestJS from
zero.

Keep and adapt:

-   NestJS bootstrap
-   config system
-   TypeORM setup
-   common infrastructure
-   auth foundations
-   user module
-   password reset foundations
-   mail provider abstraction
-   health checks
-   tests
-   Docker setup
-   Husky/ESLint/Prettier

Remove or isolate V1-unrelated modules:

-   billing
-   payments
-   plans
-   subscriptions
-   Stripe
-   files
-   socket
-   unrelated application workers
-   unnecessary i18n

## 8. Architectural Rules

1.  No Prisma.
2.  No database `synchronize` in production.
3.  No plaintext passwords.
4.  No plaintext refresh tokens in the database.
5.  No access tokens in localStorage.
6.  Use HTTP-only cookies for browser authentication.
7.  Refresh tokens are rotated.
8.  Refresh-token reuse revokes the affected session.
9.  DTOs are used for external input.
10. `ValidationPipe` uses whitelist protection.
11. Authorization is enforced server-side.
12. Sensitive data is never written to logs.
13. Security-sensitive state has explicit expiration.
14. Database migrations are committed.
15. Tests must cover security-critical flows.

## 9. Definition of Done

The structure is complete when:

-   modules have clear ownership
-   dependencies flow in one direction
-   entities are separated from controllers
-   authentication/session/authorization boundaries are explicit
-   unrelated modules are removed
-   configuration is centralized
-   tests have a predictable location
-   Docker can start required infrastructure
-   documentation explains the architecture
-   another developer can navigate the project without tribal knowledge
