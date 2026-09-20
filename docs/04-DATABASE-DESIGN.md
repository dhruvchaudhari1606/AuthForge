# AuthForge --- Database Design

## 1. Database Choice

AuthForge uses **PostgreSQL + TypeORM**.

PostgreSQL stores durable identity and security state. Redis stores
short-lived or high-frequency operational state.

Do not use Prisma in this project.

## 2. Core Tables

``` text
users
user_sessions
roles
permissions
user_roles
role_permissions
password_resets
email_verifications
audit_logs
```

## 3. Users

Suggested columns:

  Column              Type           Notes
  ------------------- -------------- --------------------------------
  id                  UUID           Primary key
  email               VARCHAR        Unique, normalized
  password_hash       VARCHAR        Never plaintext
  first_name          VARCHAR        Optional
  last_name           VARCHAR        Optional
  status              ENUM/VARCHAR   ACTIVE, LOCKED, DISABLED, etc.
  email_verified_at   TIMESTAMP      Nullable
  last_login_at       TIMESTAMP      Nullable
  created_at          TIMESTAMP      Required
  updated_at          TIMESTAMP      Required

Indexes:

-   unique email
-   status where useful
-   created_at where operational reporting requires it

Email normalization must be consistent across registration, login and
recovery.

## 4. User Sessions

Suggested columns:

  Column               Type
  -------------------- ----------------
  id                   UUID
  user_id              UUID
  refresh_token_hash   VARCHAR
  device_name          VARCHAR
  browser              VARCHAR
  os                   VARCHAR
  user_agent           TEXT
  ip_address           INET/VARCHAR
  last_active_at       TIMESTAMP
  expires_at           TIMESTAMP
  revoked_at           TIMESTAMP NULL
  created_at           TIMESTAMP

Indexes:

-   user_id
-   expires_at
-   revoked_at
-   unique/session lookup fields as appropriate

Never store the raw refresh token.

## 5. Roles

``` text
id
name
description
created_at
updated_at
```

Role names should be unique.

Example:

``` text
USER
ADMIN
```

## 6. Permissions

``` text
id
name
description
created_at
updated_at
```

Use stable permission identifiers such as:

``` text
users.read
users.update
roles.read
roles.manage
permissions.read
permissions.manage
sessions.revoke
```

## 7. User Roles

Many-to-many relationship:

``` text
users ← user_roles → roles
```

Recommended constraints:

``` text
PRIMARY KEY (user_id, role_id)
FOREIGN KEY user_id → users.id
FOREIGN KEY role_id → roles.id
```

## 8. Role Permissions

``` text
roles ← role_permissions → permissions
```

Recommended composite primary key:

``` text
(role_id, permission_id)
```

## 9. Password Resets

Suggested fields:

``` text
id
user_id
token_hash
expires_at
used_at
created_at
```

Rules:

-   store only token hash
-   short expiration
-   one-time use
-   index user_id
-   index expires_at
-   mark used instead of reusing

## 10. Email Verification

Suggested fields:

``` text
id
user_id
token_hash
expires_at
verified_at
created_at
```

The token should be generated using a cryptographically secure random
source.

## 11. Audit Logs

Suggested fields:

``` text
id
user_id nullable
event
ip_address
user_agent
metadata JSONB
created_at
```

Events may include:

``` text
AUTH_REGISTER
AUTH_LOGIN_SUCCESS
AUTH_LOGIN_FAILURE
AUTH_LOGOUT
AUTH_LOGOUT_ALL
AUTH_REFRESH
AUTH_REFRESH_REUSE_DETECTED
PASSWORD_CHANGED
PASSWORD_RESET_REQUESTED
PASSWORD_RESET_COMPLETED
EMAIL_VERIFIED
SESSION_REVOKED
ROLE_CHANGED
PERMISSION_CHANGED
```

Do not store passwords, raw JWTs, raw reset tokens or raw refresh
tokens.

## 12. Relationships

``` text
User
 ├── Sessions
 ├── PasswordResets
 ├── EmailVerifications
 ├── AuditLogs
 └── Roles
       └── Permissions
```

## 13. TypeORM Rules

Use:

-   UUID primary keys
-   explicit column types
-   explicit relations
-   indexes
-   constraints
-   migrations

Avoid:

``` ts
synchronize: true
```

in production.

## 14. Transactions

Use transactions for operations that require atomicity.

Examples:

### Registration

``` text
create user
+ assign default role
+ create verification record
```

### Role assignment

``` text
validate target
+ insert role relation
+ audit event
```

### Refresh rotation

``` text
validate session
+ invalidate old refresh token state
+ persist new hash
+ update last_active_at
```

## 15. Concurrency

Refresh rotation is security-sensitive.

Use a transaction and appropriate row locking to prevent two
simultaneous refresh requests from both successfully rotating the same
token.

Conceptually:

``` text
BEGIN
SELECT session FOR UPDATE
validate session/token
rotate
COMMIT
```

The exact TypeORM locking API should follow the installed TypeORM
version.

## 16. PostgreSQL vs Redis

### PostgreSQL

Use for:

-   users
-   sessions
-   roles
-   permissions
-   password resets
-   verification records
-   audit logs

### Redis

Use for:

-   rate-limit counters
-   temporary login-attempt state
-   short-lived security state
-   optional authorization cache
-   optional token/revocation support if architecture later requires it

Do not duplicate durable session state in Redis without a clear reason.

## 17. Migration Strategy

Every schema change gets a migration.

Typical commands:

``` bash
npm run migration:generate
npm run migration:run
npm run migration:revert
```

Use the repository's existing scripts if they already differ.

## 18. Seed Strategy

Seed:

-   default roles
-   baseline permissions
-   role-permission mappings
-   optional development admin account

Never commit real production credentials.

## 19. Performance

Start with correct indexes rather than premature optimization.

Important query patterns:

-   find user by email
-   find sessions by user
-   find active session by ID
-   find role/permission relationships
-   find unexpired password/verification token
-   audit events by user/time

Use `EXPLAIN ANALYZE` only when real performance problems appear.

## 20. Data Protection

-   database credentials from secrets
-   TLS where deployment requires it
-   least-privileged database user
-   backups
-   retention policy for audit data
-   no secrets in seed files
-   no sensitive values in logs

## 21. Fresh Database Test

A clean database must be able to reach the required state through:

``` text
migrations
→ seed
→ application startup
```

Do not rely on a manually modified local database.

## 22. Definition of Done

Database implementation is complete when:

-   all required entities exist
-   relationships are correct
-   indexes and constraints exist
-   migrations work from zero
-   seeders work
-   refresh-token hashes are protected
-   transactions cover security-sensitive mutations
-   tests verify persistence behavior
-   no production synchronization is enabled
