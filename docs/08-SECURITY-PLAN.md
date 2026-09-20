# AuthForge --- Security Plan

## 1. Security Objectives

AuthForge must protect:

-   credentials
-   authentication tokens
-   sessions
-   personal identity data
-   authorization state
-   password reset tokens
-   email verification tokens
-   audit data

Security is a cross-cutting requirement, not a final checklist item.

## 2. Threat Model

Consider:

-   credential stuffing
-   brute-force login
-   stolen cookies
-   refresh-token theft
-   refresh-token replay
-   session fixation
-   CSRF
-   XSS
-   CORS abuse
-   privilege escalation
-   mass assignment
-   SQL injection
-   insecure direct object references
-   sensitive log leakage
-   secret exposure
-   dependency vulnerabilities
-   compromised email reset flow

## 3. Password Security

Requirements:

-   strong password policy
-   adaptive password hashing
-   unique salt
-   no plaintext storage
-   no plaintext logs
-   generic authentication errors

Password policy should be documented and configurable where appropriate.

## 4. JWT Security

Access tokens:

-   short lifetime
-   minimal claims
-   signed with a strong secret/key
-   issuer/audience configured where appropriate
-   reject expired tokens

Refresh tokens:

-   longer lifetime
-   associated with server-side session
-   hashed in DB
-   rotated
-   reuse detected

## 5. Cookies

Recommended:

``` text
HttpOnly=true
Secure=true in production
SameSite=Lax/Strict where compatible
```

Cookie configuration must match the frontend/API deployment model.

Avoid broad cookie domains unless required.

## 6. CSRF

Because browser authentication uses cookies, CSRF must be considered.

Choose an explicit deployment strategy:

-   SameSite protections for compatible same-site deployments
-   CSRF token mechanism for cross-site scenarios
-   strict origin checks where appropriate

Document the chosen strategy rather than assuming CORS alone prevents
CSRF.

## 7. CORS

Allow only configured origins.

Do not use:

``` text
origin: "*"
```

when credentials/cookies are enabled.

Validate origins from environment/configuration.

## 8. Security Headers

Use Helmet or equivalent.

Consider:

-   Content-Security-Policy
-   Strict-Transport-Security
-   X-Content-Type-Options
-   Referrer-Policy
-   Frame protection
-   Permissions-Policy

Tune CSP to the actual application instead of blindly copying a policy.

## 9. Validation

Use a global `ValidationPipe` with:

``` text
whitelist: true
forbidNonWhitelisted: true
transform: true
```

DTOs must expose only allowed fields.

This is important for preventing mass assignment.

## 10. Rate Limiting

High-risk endpoints:

``` text
/login
/register
/refresh
/forgot-password
/reset-password
/resend-verification
```

Use Redis-backed counters where distributed deployments require shared
state.

Rate limits should be observable and configurable.

## 11. Account Protection

Consider:

-   failed login counters
-   temporary lockout/throttling
-   IP-aware rate limits
-   account status
-   suspicious refresh reuse detection

Do not create permanent account lockouts that enable trivial
denial-of-service unless the business requirement justifies it.

## 12. SQL Injection

Use TypeORM parameterization.

Do not concatenate untrusted values into raw SQL.

Any raw query must be reviewed.

## 13. Object-Level Authorization

Every resource operation must verify ownership or privilege.

Authentication alone does not authorize access to another user's
records.

## 14. Secrets

Never commit:

-   JWT secrets
-   database passwords
-   SMTP passwords
-   API keys
-   Sentry secrets
-   cloud credentials

Use environment variables locally and a secrets manager/CI secret store
in deployment.

## 15. Logging

Log:

-   request ID
-   method/path
-   status
-   duration
-   user ID where safe
-   security events

Do not log:

-   passwords
-   cookies
-   authorization headers
-   raw JWTs
-   refresh tokens
-   reset tokens

## 16. Audit Logging

Audit high-value events:

``` text
LOGIN
LOGOUT
TOKEN_REUSE
PASSWORD_CHANGE
PASSWORD_RESET
EMAIL_VERIFICATION
SESSION_REVOCATION
ROLE_CHANGE
PERMISSION_CHANGE
```

Audit logs are not a replacement for application logs.

## 17. Sentry/Error Monitoring

Use Sentry or an equivalent system for unexpected errors.

Before sending events:

-   redact cookies
-   redact authorization headers
-   redact passwords
-   redact reset tokens
-   review request bodies

## 18. Database Security

-   least-privileged DB account
-   encrypted transport where required
-   backups
-   no production `synchronize`
-   migration-based schema changes
-   restricted network access

## 19. Redis Security

-   authentication where supported
-   restricted network exposure
-   TTL on temporary data
-   no sensitive raw tokens unless architecture explicitly requires it
-   avoid public Redis ports

## 20. Docker Security

-   non-root runtime where practical
-   minimal image
-   no secrets baked into image
-   health checks
-   pinned major/runtime versions
-   production-specific compose/deployment configuration

## 21. Dependency Security

Regularly run:

``` bash
npm audit
```

and use automated dependency update/security tooling where appropriate.

Review major upgrades instead of blindly accepting them.

## 22. Security Testing

Include tests for:

-   invalid credentials
-   rate limiting
-   token expiration
-   token reuse
-   revoked sessions
-   CSRF strategy
-   CORS
-   role escalation
-   ownership violations
-   DTO over-posting
-   malformed JWTs

## 23. Security Checklist

``` text
[ ] Passwords hashed
[ ] Refresh tokens hashed
[ ] Refresh rotation
[ ] Reuse detection
[ ] HTTP-only cookies
[ ] Secure cookies in production
[ ] CORS restricted
[ ] CSRF strategy documented
[ ] Helmet/security headers
[ ] DTO validation
[ ] Rate limiting
[ ] Ownership checks
[ ] Audit logging
[ ] Sensitive log redaction
[ ] Secrets outside source control
[ ] DB migrations
[ ] Redis protected
[ ] Docker hardened
[ ] Security tests
```

## 24. Definition of Done

Security is complete when the checklist is implemented, tested and
documented rather than merely configured in theory.
