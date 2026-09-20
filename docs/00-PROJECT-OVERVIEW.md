# AuthForge — Project Overview

## 1. Document Purpose

This document provides the complete high-level overview of **AuthForge**.

It is intended to be given directly to another AI/developer so they can
understand:

- What we are building
- Why we are building it
- Who it is designed for
- What functionality it should provide
- What technologies it should use
- What security standards it should demonstrate
- What the V1 scope is
- What is intentionally excluded
- What the final project should demonstrate

This document describes the **product and engineering vision**.

It does not define the exact implementation steps. Those are defined in
separate documents.

---

# 2. Project Name

## AuthForge

**AuthForge — Authentication & Identity Service**

AuthForge is a standalone backend service responsible for authentication,
identity, sessions, authorization, and security-related identity workflows.

The service should be designed so that another application can integrate
with it instead of implementing authentication from scratch.

---

# 3. One-Line Description

> AuthForge is a production-oriented, modular authentication and identity
> service built with NestJS, TypeScript, PostgreSQL, TypeORM, Redis and JWT,
> providing secure authentication, session management, RBAC, permissions,
> password recovery, email verification and security auditing.

---

# 4. What Are We Trying to Build?

We are building a **reusable authentication and identity backend**.

The goal is not to create only:

```text
POST /login
POST /register
```

with basic JWT handling.

Instead, AuthForge should demonstrate how a real backend authentication
service can be designed with:

- Secure authentication
- Access and refresh tokens
- Refresh token rotation
- Refresh token reuse detection
- HTTP-only cookies
- Multi-device sessions
- Session revocation
- Password management
- Email verification
- Password reset
- Role-based access control
- Permission-based authorization
- Rate limiting
- Redis-backed security mechanisms
- Audit logging
- PostgreSQL
- TypeORM
- Docker
- Automated testing
- Swagger/OpenAPI
- Production-oriented configuration

The final result should look and feel like a service that could realistically
be used as the authentication foundation for another application.

---

# 5. Problem We Are Solving

Many applications repeatedly implement the same authentication features:

```text
Registration
Login
Logout
JWT
Refresh tokens
Password hashing
Password reset
Email verification
Sessions
Roles
Permissions
Security controls
```

Implementing these independently for every application creates duplicated
code and inconsistent security practices.

AuthForge aims to provide a centralized, reusable foundation for these
identity-related responsibilities.

---

# 6. Example Applications That Could Use AuthForge

AuthForge should be suitable as the backend identity layer for:

```text
SaaS applications
Admin dashboards
Marketplaces
E-commerce applications
Internal business applications
Developer platforms
Subscription applications
Enterprise web applications
Mobile application backends
API platforms
```

Example:

```text
                    ┌─────────────────────┐
                    │   React / Next.js   │
                    │     Frontend        │
                    └──────────┬──────────┘
                               │
                               v
                    ┌─────────────────────┐
                    │      AuthForge      │
                    │ Authentication      │
                    │ Identity            │
                    │ Sessions            │
                    │ Authorization       │
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                v                             v
          PostgreSQL                         Redis
```

Other applications can consume AuthForge's APIs to authenticate users and
enforce identity-related policies.

---

# 7. Primary Goals

## Goal 1 — Secure Authentication

Provide secure:

- Registration
- Login
- Logout
- Access token generation
- Refresh token generation
- Token rotation
- Token reuse detection

---

## Goal 2 — Identity Management

Maintain user identity information such as:

- Email
- Name
- Account status
- Email verification status
- Last login
- Account timestamps

---

## Goal 3 — Session Management

Support multiple user sessions/devices.

For example:

```text
Dhruv
│
├── Chrome / Windows
├── Safari / iPhone
└── Firefox / Laptop
```

Users should be able to:

- View sessions
- Revoke a specific session
- Revoke all sessions
- Automatically expire sessions

---

## Goal 4 — Authorization

Support:

```text
Roles
Permissions
RBAC
Permission-based authorization
Guards
Decorators
```

Example:

```text
Admin
 ├── users.read
 ├── users.create
 ├── users.update
 └── users.delete

User
 ├── profile.read
 └── profile.update
```

---

## Goal 5 — Account Recovery

Provide secure:

```text
Forgot password
Password reset
Password change
```

---

## Goal 6 — Email Verification

Support:

```text
Email verification
Resend verification
Verification expiration
Verification state
```

---

## Goal 7 — Security Auditing

Record important security events such as:

```text
Login success
Login failure
Logout
Password changed
Password reset
Email verified
Session created
Session revoked
All sessions revoked
```

Audit logs should help understand security-related activity without storing
sensitive credentials or raw authentication tokens.

---

# 8. Target Users

AuthForge is primarily an **application/backend integration service**.

Its direct consumers are expected to be:

```text
Backend applications
Frontend applications
Mobile applications
Internal applications
Other APIs/services
```

It is not intended to be a consumer-facing social application.

---

# 9. Core Feature Set — V1

The first version should focus on the following.

## Authentication

```text
Registration
Login
Logout
Access tokens
Refresh tokens
Refresh token rotation
Refresh token reuse detection
```

---

## User Identity

```text
User profile
User status
Email verification state
Last login
```

---

## Sessions

```text
Create session
List sessions
Revoke session
Revoke all sessions
Session expiration
Device metadata
```

---

## Password Management

```text
Change password
Forgot password
Reset password
Password hashing
Reset-token expiration
```

---

## Email Verification

```text
Send verification
Verify email
Resend verification
Verification expiration
```

---

## Authorization

```text
Roles
Permissions
Role-permission mapping
User-role mapping
Role guards
Permission guards
Authorization decorators
```

---

## Security

```text
Rate limiting
Login attempt protection
Secure cookies
Security headers
CORS
Request validation
Token expiration
Session expiration
Audit logging
Sensitive-data protection
```

---

# 10. Authentication Model

AuthForge will use:

```text
Access Token
+
Refresh Token
```

The access token should be short-lived.

The refresh token should be long-lived.

Example configuration:

```text
Access token:
15 minutes

Refresh token:
30 days
```

These values are examples and must be configurable through environment
variables.

---

# 11. Refresh Token Rotation

Refresh-token rotation is a core security feature.

Example:

```text
Initial Login
     |
     v
Refresh Token A
     |
     | /refresh
     v
Token A invalidated
     |
     v
Refresh Token B created
```

If Token A is used again:

```text
Token A reused
     |
     v
Reuse detected
     |
     v
Session revoked
```

Only the hash of the refresh token should be stored in the database.

The raw refresh token must not be persisted in plaintext.

---

# 12. Cookie Strategy

Authentication tokens should use secure HTTP-only cookies.

Conceptually:

```text
access_token
refresh_token
```

Cookie configuration should consider:

```text
HttpOnly
Secure
SameSite
Domain
Path
Expiration
```

The exact configuration should differ appropriately between development
and production environments.

---

# 13. Technology Stack

## Backend

```text
Node.js
NestJS
TypeScript
```

---

## Database

```text
PostgreSQL
TypeORM
```

### Important

Prisma is intentionally **not** being used for this project.

The existing project already has a good TypeORM architecture and we will
continue using it.

---

## Cache / Security Infrastructure

```text
Redis
```

Redis should be used for meaningful use cases such as:

```text
Rate limiting
Login attempt tracking
Temporary security state
Temporary verification/reset state
Caching where justified
```

Redis should not be added just for demonstration purposes.

---

## Authentication

```text
JWT
Passport / JWT strategy where appropriate
HTTP-only cookies
```

---

## API Documentation

```text
Swagger / OpenAPI
```

---

## Testing

```text
Jest
E2E testing
Unit testing
```

---

## Infrastructure

```text
Docker
Docker Compose
```

---

## Code Quality

```text
ESLint
Prettier
Husky
```

---

## Monitoring

Existing Sentry/error-monitoring architecture should be retained and adapted
where useful.

---

# 14. Database Model — High Level

The main identity model is:

```text
User
 │
 ├── Sessions
 │
 ├── Password Reset
 │
 ├── Email Verification
 │
 ├── User Roles
 │       │
 │       v
 │      Roles
 │       │
 │       v
 │   Permissions
 │
 └── Audit Logs
```

Expected entities:

```text
User
Session
Role
Permission
UserRole
RolePermission
PasswordReset
EmailVerification
AuditLog
```

A detailed database design will be documented separately.

---

# 15. User Entity — Conceptual Model

The user should contain information similar to:

```text
id
email
passwordHash
firstName
lastName
status
emailVerifiedAt
lastLoginAt
createdAt
updatedAt
```

The exact entity implementation should follow the existing project's
TypeORM conventions.

---

# 16. Session Entity — Conceptual Model

A session should track information similar to:

```text
id
userId
refreshTokenHash
deviceName
browser
os
userAgent
ipAddress
lastActiveAt
expiresAt
revokedAt
createdAt
```

This enables multi-device session management.

---

# 17. Role and Permission Model

Authorization should use a flexible RBAC structure.

Conceptually:

```text
User
 |
 +---- UserRole ----> Role
                         |
                         +---- RolePermission ----> Permission
```

This allows:

```text
One user → multiple roles
One role → multiple permissions
```

Example:

```text
Admin
 ├── users.read
 ├── users.create
 ├── users.update
 ├── users.delete
 └── audit.read
```

---

# 18. Audit Logging

AuthForge should maintain an audit trail for important security events.

Examples:

```text
LOGIN_SUCCESS
LOGIN_FAILED
LOGOUT
PASSWORD_CHANGED
PASSWORD_RESET_REQUESTED
PASSWORD_RESET_COMPLETED
EMAIL_VERIFIED
SESSION_CREATED
SESSION_REVOKED
ALL_SESSIONS_REVOKED
```

Audit metadata may include:

```text
userId
IP address
User agent
event type
metadata
timestamp
```

Never store:

```text
Passwords
Raw refresh tokens
Raw access tokens
JWT secrets
API keys
```

---

# 19. API Surface — High Level

The exact API contract will be defined separately.

Expected authentication endpoints include:

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/change-password
```

Password recovery:

```text
POST /auth/forgot-password
POST /auth/reset-password
```

Email verification:

```text
POST /auth/verify-email
POST /auth/resend-verification
```

User:

```text
GET   /users/me
PATCH /users/me
```

Sessions:

```text
GET    /sessions
DELETE /sessions/:id
DELETE /sessions
```

Authorization/admin functionality may include:

```text
GET    /roles
POST   /roles
PATCH  /roles/:id
DELETE /roles/:id

GET    /permissions
POST   /permissions
```

The exact endpoints should be finalized during implementation.

---

# 20. Security Philosophy

Security is one of the main reasons for building AuthForge.

The project should demonstrate practical security rather than simply
mentioning security technologies.

Important areas:

### Passwords

Passwords must be securely hashed.

Never store plaintext passwords.

---

### Tokens

Never store raw refresh tokens in the database.

Use token hashing and rotation.

---

### Cookies

Use secure HTTP-only cookies for authentication tokens.

---

### Sessions

Support session revocation and expiration.

---

### Rate Limiting

Protect authentication endpoints against excessive requests and brute-force
attempts.

---

### Validation

All external input must be validated.

---

### Headers

Use appropriate security headers.

---

### CORS

Use explicit CORS configuration.

Do not use unrestricted production CORS.

---

### Logging

Never log secrets or credentials.

---

### Errors

Do not expose internal implementation details to clients.

---

# 21. Architecture Philosophy

AuthForge should follow these principles.

## Modular

Each major business capability should have its own module.

```text
Auth
Users
Authorization
Sessions
Password Reset
Email Verification
Mail
Audit
Health
```

---

## Separation of Concerns

Authentication and authorization are separate concepts.

```text
Authentication
=
Who are you?

Authorization
=
What are you allowed to do?
```

---

## Reusable

The service should be designed so another application could consume it.

---

## Production-Oriented

The code should include practical concerns such as:

```text
Validation
Logging
Security
Testing
Configuration
Migrations
Docker
Monitoring
Documentation
```

---

## Maintainable

Avoid:

```text
Giant services
Duplicated logic
Unclear module boundaries
Hardcoded configuration
Unnecessary abstractions
```

---

# 22. Existing Architecture Strategy

The project is not being built from a blank NestJS application.

There is an existing NestJS repository with a good architecture.

The migration strategy is:

```text
Existing NestJS Architecture
            |
            v
Remove unrelated application features
            |
            v
Retain reusable infrastructure
            |
            v
Adapt existing authentication
            |
            v
Add identity features
            |
            v
Harden security
            |
            v
Add testing/documentation
            |
            v
AuthForge
```

The existing architecture should be treated as an asset.

---

# 23. Existing Functionality We Intend to Reuse

Where appropriate, AuthForge will reuse existing implementations for:

```text
NestJS bootstrap
Configuration
Environment validation
TypeORM
Database migrations
Seeders
Authentication
Sessions
Password reset
Users
Mail providers
Health checks
Logging
Exception handling
Interceptors
Middleware
Swagger
Sentry
Docker
Jest
Husky
ESLint
Prettier
```

The actual code must be inspected before reuse.

---

# 24. Functionality That Does Not Belong in AuthForge V1

The existing repository contains unrelated functionality.

AuthForge V1 should not contain:

```text
Payments
Stripe
Subscriptions
Billing
Plans
File management
Application-specific file uploads
Socket-specific application features
```

These belong to other projects/services.

---

# 25. Features Intentionally Out of Scope

Do not attempt to build a complete enterprise identity platform in V1.

The following are intentionally out of scope:

```text
SAML
LDAP
Enterprise SSO
Passkeys / WebAuthn
Complex multi-tenancy
Organization management
Advanced fraud detection
Face recognition
Complex identity federation
Large social-login provider matrix
Billing
Payment processing
Subscription management
```

These may be future extensions.

---

# 26. Possible Future Versions

## V2

Potential features:

```text
Google OAuth
GitHub OAuth
Other OAuth providers
TOTP / MFA
Background mail worker
Advanced session controls
```

---

## V3

Potential features:

```text
Passkeys
WebAuthn
Multi-tenancy
Organizations
Enterprise SSO
SAML
Advanced identity federation
```

The V1 architecture should remain extensible without implementing these
features prematurely.

---

# 27. Testing Philosophy

Testing should focus on important behavior.

We do not need hundreds of meaningless tests.

We need meaningful coverage of:

```text
Registration
Login
Invalid login
Token authentication
Token refresh
Token rotation
Token reuse detection
Logout
Session revocation
Logout all
Password change
Password reset
Email verification
RBAC
Permissions
Rate limiting
Health checks
```

Both unit and E2E tests should be used where appropriate.

---

# 28. Docker / Local Development

The local development environment should be reproducible.

Target infrastructure:

```text
                ┌───────────────────┐
                │     AuthForge     │
                │       API         │
                └─────────┬─────────┘
                          │
                 ┌────────┴────────┐
                 │                 │
                 v                 v
          ┌─────────────┐   ┌─────────────┐
          │ PostgreSQL  │   │    Redis    │
          └─────────────┘   └─────────────┘
```

The goal is to make the project easy for another developer to start
locally.

---

# 29. API Documentation

Swagger/OpenAPI should document the API.

Expected documentation endpoint:

```text
/api/docs
```

Swagger should eventually document:

```text
Authentication
Users
Sessions
Authorization
Password reset
Email verification
Health
```

---

# 30. Developer Experience

Another developer should be able to understand:

```text
What the project does
How authentication works
Where users are managed
Where sessions are managed
Where authorization lives
How tokens work
How Redis is used
How the database is structured
How to run the project
How to run tests
How to view Swagger
```

The repository should be easy to navigate.

---

# 31. Portfolio Objective

AuthForge is also intended to be a strong backend portfolio project.

It should demonstrate practical knowledge of:

```text
Node.js
NestJS
TypeScript
PostgreSQL
TypeORM
Redis
JWT
Authentication
Authorization
RBAC
Security
Session management
API design
Testing
Docker
Cloud-ready architecture
System design
```

A technical reviewer should be able to see that the developer understands
more than basic CRUD APIs.

---

# 32. What This Project Should Demonstrate in an Interview

The project should provide opportunities to discuss:

### Authentication

- Why use access and refresh tokens?
- Why rotate refresh tokens?
- How does reuse detection work?
- Why use HTTP-only cookies?
- How should token expiration work?

### Security

- Password hashing
- Rate limiting
- Brute-force protection
- CORS
- Security headers
- Secret management
- Sensitive logging

### Database

- PostgreSQL
- Relationships
- Indexes
- Constraints
- Migrations
- Transactions

### Redis

- Why Redis is used
- Rate limiting
- Temporary state
- Expiration

### Authorization

- RBAC
- Permissions
- Guards
- Decorators

### Architecture

- Modular NestJS
- Separation of concerns
- Service boundaries
- Reusability

### Testing

- Unit testing
- E2E testing
- Authentication workflow testing

### Infrastructure

- Docker
- Environment configuration
- CI/CD readiness

---

# 33. What AuthForge Is NOT

AuthForge is not:

```text
A frontend application
A complete SaaS product
A payment service
A billing service
A subscription platform
A file storage platform
A social network
A complete enterprise IAM platform
```

It is specifically:

> An authentication and identity backend service.

---

# 34. V1 Success Criteria

AuthForge V1 is successful when another application could conceptually
integrate with it and rely on it for:

```text
User registration
User login
User logout
Token refresh
Session management
Password management
Email verification
Role-based authorization
Permission-based authorization
Security auditing
```

And the service demonstrates:

```text
Secure design
Clean architecture
Good testing
Good documentation
Dockerized development
Database migrations
Redis integration
Production-oriented configuration
```

---

# 35. Final Product Vision

The desired architecture is:

```text
                           AuthForge
                              |
              ┌───────────────┼────────────────┐
              │               │                │
              v               v                v
          Authentication   Identity       Authorization
              │               │                │
              │               │                │
              v               v                v
           Tokens           Users        Roles / Permissions
              │               │                │
              v               v                v
          Sessions        User State          RBAC
              │
              └────────────────┐
                               v
                             Audit
                               │
                    ┌──────────┴──────────┐
                    v                     v
               PostgreSQL               Redis
                    │
                    v
                 TypeORM
```

Supporting capabilities:

```text
Password Reset
Email Verification
Mail Service
Rate Limiting
Logging
Validation
Swagger
Testing
Docker
Monitoring
```

---

# 36. Final Engineering Objective

The final project should achieve the following balance:

```text
Simple enough to understand
             +
Secure enough to trust
             +
Structured enough to maintain
             +
Flexible enough to extend
             +
Complete enough to demonstrate real engineering
```

Avoid both extremes.

### Too simple

```text
Basic JWT login/register demo
```

### Too complex

```text
Enterprise IAM platform containing every identity technology
```

### Target

```text
Professional Authentication & Identity Service
```

---

# 37. Documentation Structure

The project documentation will be split into multiple focused documents.

Recommended order:

```text
00-PROJECT-OVERVIEW.md
01-PROJECT-STRUCTURE.md
02-MIGRATION-FROM-EXISTING-REPO.md
03-IMPLEMENTATION-PLAN.md
04-DATABASE-DESIGN.md
05-AUTHENTICATION-FLOW.md
06-SESSION-MANAGEMENT.md
07-AUTHORIZATION-RBAC.md
08-SECURITY-PLAN.md
09-MAIL-AND-VERIFICATION.md
10-TESTING-PLAN.md
11-DOCKER-AND-INFRASTRUCTURE.md
12-CI-CD-PLAN.md
13-API-DOCUMENTATION-PLAN.md
14-README-CHECKLIST.md
```

Each document should have a specific purpose.

Do not duplicate large implementation details unnecessarily between
documents.

---

# 38. Important Implementation Rule

This document describes the **desired product and engineering direction**.

It does not mean that all functionality already exists.

The implementing AI must inspect the actual repository before modifying code.

Use:

```text
Inspect
  ↓
Understand
  ↓
Reuse existing implementation where appropriate
  ↓
Refactor where necessary
  ↓
Implement missing functionality
  ↓
Test
```

Never assume that a feature is implemented simply because it is mentioned
in this document.

---

# 39. Final Definition of AuthForge

> AuthForge is a reusable, production-oriented authentication and identity
> service built with NestJS, TypeScript, PostgreSQL, TypeORM and Redis.
>
> It provides secure user authentication, JWT-based access and refresh
> tokens, refresh-token rotation and reuse detection, HTTP-only cookie
> authentication, multi-device session management, password recovery,
> email verification, role-based access control, permissions, rate limiting,
> security auditing, API documentation and automated testing.
>
> The service is intentionally focused on identity and authentication.
> Payment, billing, subscription, file management and unrelated business
> functionality are excluded.
>
> The implementation will build upon an existing mature NestJS architecture
> rather than replacing it with a simplified tutorial structure.
