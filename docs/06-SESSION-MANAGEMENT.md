# AuthForge --- Session Management

## 1. Purpose

Sessions provide durable server-side control over refresh tokens and
allow a user to manage multiple devices.

A session represents:

``` text
User
+
Device
+
Refresh-token state
+
Expiration
+
Revocation state
```

## 2. Session Entity

Recommended fields:

``` text
id
user_id
refresh_token_hash
device_name
browser
os
user_agent
ip_address
last_active_at
expires_at
revoked_at
created_at
```

## 3. Session Creation

A session is created after successful login.

Process:

``` text
login success
→ generate refresh token
→ create session ID
→ hash refresh token
→ persist session
→ issue cookies
```

Store metadata carefully. User-agent/IP information can be useful for
security, but it should be treated as sensitive operational data.

## 4. Refresh Token Storage

Never store:

``` text
refresh_token
```

Store:

``` text
hash(refresh_token)
```

Use a cryptographically strong token and a suitable keyed/hash strategy.

## 5. Rotation

Initial state:

``` text
Session
  token_hash = HASH(A)
```

Refresh:

``` text
Client sends A
→ validate A
→ generate B
→ update session
   token_hash = HASH(B)
→ send B
```

After rotation:

``` text
A = invalid
B = valid
```

## 6. Reuse Detection

If A is submitted after B has replaced it:

``` text
HASH(A) != stored HASH(B)
```

Treat this as suspicious token reuse.

Actions:

1.  reject request
2.  revoke session
3.  audit event
4.  clear authentication cookies
5.  return unauthorized response

Do not silently accept the old token.

## 7. Concurrency

Two refresh requests can arrive at almost the same time.

Without protection:

``` text
Request A validates old token
Request B validates old token
A rotates
B rotates
```

This can create inconsistent session state.

Use a transaction and row lock where appropriate:

``` text
BEGIN
  SELECT session FOR UPDATE
  validate
  rotate
COMMIT
```

The implementation must follow the TypeORM version used by the
repository.

## 8. Session Listing

Endpoint:

``` http
GET /sessions
```

Return safe metadata:

``` json
{
  "id": "...",
  "deviceName": "...",
  "browser": "...",
  "os": "...",
  "lastActiveAt": "...",
  "createdAt": "...",
  "expiresAt": "...",
  "current": true
}
```

Never return refresh-token hashes.

## 9. Revoke One Session

Endpoint:

``` http
DELETE /sessions/:id
```

Rules:

-   authenticated user
-   session must belong to current user
-   mark revoked
-   audit
-   optionally clear cookies if current session

## 10. Revoke All Sessions

Endpoint:

``` http
DELETE /sessions
```

Revoke all active sessions for the authenticated user.

## 11. Session Expiration

A session is invalid when:

``` text
revoked_at IS NOT NULL
OR expires_at <= NOW()
```

Expired sessions should not authenticate.

Cleanup can run periodically.

## 12. Session Ownership

Users may only revoke sessions belonging to themselves.

Administrative access, if added later, must use explicit privileged
permissions.

## 13. Redis Boundary

Redis can support:

-   rate limits
-   temporary security state
-   optional session-related cache

PostgreSQL remains the source of truth for durable sessions.

## 14. Audit Events

Session events:

``` text
SESSION_CREATED
SESSION_REFRESHED
SESSION_REVOKED
SESSION_REVOKED_ALL
REFRESH_TOKEN_REUSE_DETECTED
```

## 15. Session Security

Do:

-   hash refresh tokens
-   rotate tokens
-   expire sessions
-   revoke on reuse
-   use secure cookies
-   avoid token logging
-   enforce user ownership

Do not:

-   store raw refresh tokens
-   put refresh tokens in URLs
-   expose refresh tokens to frontend JavaScript
-   trust a session ID without ownership validation

## 16. Testing Matrix

Test:

-   session creation
-   valid refresh
-   expired refresh
-   revoked session
-   invalid token
-   rotation
-   old-token reuse
-   concurrent refresh
-   logout
-   logout-all
-   session listing
-   cross-user session access
-   expiration cleanup

## 17. Session Lifecycle

``` text
CREATED
   ↓
ACTIVE
   ↓
ROTATED ───────┐
   ↓           │
ACTIVE         │
   ↓           │
REVOKED ←──────┘
   OR
EXPIRED
```

## 18. Definition of Done

Session management is complete when:

-   each login creates a session
-   each session stores only a token hash
-   refresh rotates tokens
-   old tokens cannot be reused
-   reuse revokes the session
-   multiple devices work
-   users can list/revoke sessions
-   logout and logout-all work
-   concurrency is protected
-   tests cover the security lifecycle
