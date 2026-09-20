# AuthForge --- Authentication Flow

## 1. Authentication Model

AuthForge uses:

-   short-lived JWT access tokens
-   long-lived JWT refresh tokens
-   HTTP-only cookies
-   server-side session records
-   refresh-token hashing
-   refresh-token rotation
-   reuse detection

Recommended starting configuration:

``` text
Access token: 15 minutes
Refresh token: 30 days
```

These values must be environment-configurable.

## 2. Registration

Endpoint:

``` http
POST /auth/register
```

Flow:

``` text
Client
  ↓
DTO validation
  ↓
normalize email
  ↓
check existing account
  ↓
hash password
  ↓
create user
  ↓
assign USER role
  ↓
create verification token
  ↓
send verification email
  ↓
audit event
  ↓
response
```

Passwords must never be stored or logged in plaintext.

## 3. Password Hashing

Use a modern password hashing algorithm supported by the project and
configured with an appropriate cost.

Requirements:

-   unique salt
-   adaptive cost
-   constant-time verification where applicable
-   no plaintext persistence
-   no password in logs

Keep hashing behind a service so the rest of the application does not
depend on a specific library.

## 4. Login

Endpoint:

``` http
POST /auth/login
```

Flow:

``` text
credentials
→ validate DTO
→ normalize email
→ locate user
→ verify password
→ check account status
→ create session
→ generate access JWT
→ generate refresh JWT
→ hash refresh token
→ persist session
→ set cookies
→ audit success
```

Failed logins should use rate limiting and should not reveal whether a
particular account exists.

## 5. Access Token

Access token claims should contain only required information.

Possible claims:

``` json
{
  "sub": "user-id",
  "sid": "session-id",
  "iat": 0,
  "exp": 0
}
```

Do not place sensitive profile data in JWT claims.

## 6. Refresh Token

Refresh token should identify the user/session sufficiently for the
server to find the session.

Store only:

``` text
hash(refresh_token)
```

in PostgreSQL.

The raw token exists only on the client cookie and in the request during
refresh.

## 7. HTTP-Only Cookies

Recommended browser cookies:

``` text
access_token
refresh_token
```

Security flags:

``` text
HttpOnly: true
Secure: true in HTTPS production
SameSite: configured according to deployment
Path: intentionally scoped
```

Do not expose tokens through JavaScript.

## 8. Protected Request

``` text
Browser
  ↓
access_token cookie
  ↓
authentication guard
  ↓
JWT validation
  ↓
user/session context
  ↓
authorization guard
  ↓
controller
```

Authentication answers:

> Who are you?

Authorization answers:

> Are you allowed to perform this action?

## 9. Refresh Flow

Endpoint:

``` http
POST /auth/refresh
```

Flow:

``` text
refresh cookie
→ verify JWT
→ identify session
→ load session
→ ensure not revoked/expired
→ compare hash
→ lock/transaction where needed
→ rotate token
→ save new hash
→ issue new access token
→ issue new refresh token
→ set cookies
```

The previous refresh token becomes invalid.

## 10. Reuse Detection

If a previously rotated refresh token is presented again:

``` text
old token
→ session lookup
→ hash mismatch
→ possible reuse
→ revoke affected session
→ audit security event
→ reject request
```

Depending on the final threat model, broader family/session revocation
can be implemented later.

## 11. Logout

Endpoint:

``` http
POST /auth/logout
```

Flow:

``` text
identify session
→ revoke session
→ clear cookies
→ audit
```

Clearing cookies alone is insufficient because the server-side session
must also be revoked.

## 12. Logout All

Endpoint:

``` http
POST /auth/logout-all
```

Flow:

``` text
authenticated user
→ revoke all active sessions
→ clear current cookies
→ audit
```

## 13. Password Change

Endpoint:

``` http
POST /auth/change-password
```

Recommended flow:

``` text
authenticate
→ validate current password
→ validate new password
→ hash new password
→ update user
→ revoke appropriate sessions
→ audit
```

A deployment may choose to revoke all other sessions after password
change.

## 14. Forgot Password

Endpoint:

``` http
POST /auth/forgot-password
```

Response should not disclose whether an email exists.

Flow:

``` text
request
→ normalize email
→ if account exists, generate token
→ store token hash
→ send email
→ return generic response
```

## 15. Reset Password

Endpoint:

``` http
POST /auth/reset-password
```

Flow:

``` text
token
→ hash/lookup
→ verify expiry
→ verify unused
→ update password
→ mark token used
→ revoke sessions as configured
→ audit
```

## 16. Email Verification

Endpoint:

``` http
POST /auth/verify-email
```

Flow:

``` text
token
→ lookup hash
→ verify expiration
→ verify unused
→ mark email verified
→ mark token verified
→ audit
```

## 17. Authentication Guards

Use separate concerns:

``` text
JwtAuthGuard
PermissionGuard
RoleGuard
```

A route should be protected explicitly.

## 18. Authentication Failure Codes

Typical responses:

``` text
401 Unauthorized
403 Forbidden
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
```

Avoid leaking internal authentication details.

## 19. Rate Limiting

Apply stronger controls to:

-   login
-   forgot password
-   reset password
-   resend verification
-   refresh

Use Redis-backed state where appropriate.

## 20. Audit Events

Record:

-   registration
-   successful login
-   failed login
-   refresh
-   logout
-   logout-all
-   refresh reuse
-   password changed
-   reset requested
-   reset completed
-   email verified

Never record:

-   passwords
-   raw access tokens
-   raw refresh tokens
-   reset tokens

## 21. Authentication Sequence

``` text
REGISTER
Client → API → User DB → Verification DB → Mail
                         ↓
LOGIN
Client → API → User DB → Password Service
                    ↓
                 Session DB
                    ↓
                 Cookies

REQUEST
Client → Access Cookie → JWT Guard → Authorization → Controller

REFRESH
Client → Refresh Cookie → Session → Rotate → Cookies

LOGOUT
Client → Session → Revoke → Clear Cookies
```

## 22. Definition of Done

Authentication is complete when:

-   registration works
-   login works
-   access tokens expire
-   refresh tokens rotate
-   reuse is detected
-   logout revokes server-side session
-   logout-all works
-   password recovery works
-   email verification works
-   protected routes reject unauthenticated requests
-   rate limits exist
-   sensitive values are not logged
-   E2E tests cover the critical lifecycle
