# AuthForge --- Testing Plan

## 1. Testing Strategy

Testing should validate both correctness and security.

Layers:

``` text
Unit
  ↓
Integration
  ↓
E2E
```

Use Jest and the repository's existing testing configuration.

## 2. Unit Tests

Test business logic in isolation.

### Auth

-   registration
-   login
-   invalid credentials
-   disabled user
-   token creation
-   logout

### Password

-   hash
-   compare
-   policy
-   change password

### Sessions

-   creation
-   rotation
-   reuse detection
-   revocation
-   expiration

### Authorization

-   role check
-   permission check
-   ownership check

### Verification

-   token generation
-   expiration
-   one-time use

## 3. Integration Tests

Test real module boundaries with PostgreSQL/Redis where practical.

Examples:

-   repository queries
-   TypeORM relationships
-   migrations
-   transaction behavior
-   role/permission queries
-   session rotation

## 4. E2E Tests

Critical flows should exercise the actual HTTP API.

### Registration

``` text
POST /auth/register
→ verify database state
→ verify mail behavior
```

### Login

``` text
POST /auth/login
→ cookies set
→ protected endpoint succeeds
```

### Refresh

``` text
login
→ capture refresh cookie
→ refresh
→ old token invalid
→ new token valid
```

### Reuse

``` text
login
→ refresh
→ submit old refresh token
→ session revoked
```

### Logout

``` text
login
→ logout
→ protected request fails
```

### Password Reset

``` text
request reset
→ use token
→ change password
→ old session behavior verified
```

### RBAC

``` text
USER → admin endpoint → 403
ADMIN → admin endpoint → success
```

## 5. Security Test Matrix

  Scenario                    Expected
  --------------------------- -----------------------
  Missing access token        401
  Invalid access token        401
  Expired access token        401
  Missing permission          403
  Cross-user session access   403/404
  Expired refresh token       401
  Revoked session             401
  Refresh reuse               401 + session revoked
  Extra DTO property          validation failure
  Excessive login attempts    429

## 6. Database Testing

Run migrations against a clean test database.

Verify:

-   constraints
-   unique email
-   foreign keys
-   cascading behavior
-   indexes where relevant
-   transactions

## 7. Redis Testing

Test:

-   rate-limit counters
-   expiration
-   isolation between users/IPs
-   failure behavior

The application should fail safely if Redis is temporarily unavailable
according to the security feature being provided.

## 8. Mail Testing

Use a mock/fake provider in unit tests.

Do not send real emails during automated tests.

Verify:

-   recipient
-   template
-   variables
-   failure handling

## 9. Cookie Testing

Verify:

-   HttpOnly
-   Secure in production configuration
-   SameSite
-   correct Path
-   expiration/max-age
-   cookie clearing on logout

## 10. Test Data

Use factories/fixtures rather than hard-coded shared state.

Examples:

``` text
createTestUser()
createTestAdmin()
createSession()
createRole()
createPermission()
```

## 11. Test Isolation

Each test should:

-   clean or isolate data
-   not depend on execution order
-   not use another test's tokens
-   not share mutable global state

## 12. Coverage

Coverage is a signal, not the objective.

Prioritize:

-   authentication
-   token lifecycle
-   sessions
-   authorization
-   password reset
-   verification
-   security boundaries

Do not inflate coverage with meaningless assertions.

## 13. CI Test Sequence

``` bash
npm ci
npm run lint
npm run test
npm run test:e2e
npm run build
```

If integration tests need Docker services:

``` bash
docker compose up -d postgres redis
npm run test:e2e
docker compose down
```

Use the actual project scripts if they differ.

## 14. Regression Policy

Every security bug should produce a regression test.

Examples:

``` text
refresh token reuse bug
→ regression test

privilege escalation bug
→ regression test

cross-user session bug
→ regression test
```

## 15. Definition of Done

Testing is complete when:

-   unit tests cover critical services
-   integration tests cover persistence
-   E2E tests cover critical workflows
-   security failure paths are tested
-   CI runs tests automatically
-   tests are deterministic
-   security fixes include regression tests
