# AuthForge --- Mail and Verification

## 1. Purpose

AuthForge uses email for:

-   email verification
-   password reset
-   optional security notifications

The mail system should remain provider-independent.

## 2. Mail Architecture

Recommended:

``` text
Auth Module
    ↓
MailService
    ↓
MailProvider interface
    ↓
Nodemailer / SendGrid / other provider
```

Authentication code should not directly instantiate an SMTP client.

## 3. Provider Abstraction

Conceptual interface:

``` ts
interface MailProvider {
  send(message: MailMessage): Promise<void>;
}
```

Provider selection comes from configuration.

## 4. Templates

Recommended templates:

``` text
email-verification
password-reset
password-changed
security-login-notification (optional)
```

Templates should be version-controlled.

## 5. Email Verification

Endpoint:

``` http
POST /auth/verify-email
```

Registration flow:

``` text
register
→ create user
→ generate random verification token
→ store token hash
→ send email
```

Verification:

``` text
token
→ hash
→ lookup
→ check expiry
→ check used/verified state
→ mark email verified
```

## 6. Token Requirements

Verification tokens must:

-   be cryptographically random
-   be single-use
-   have expiration
-   be stored hashed
-   never be logged
-   not appear in analytics or error messages

## 7. Resend Verification

Endpoint:

``` http
POST /auth/resend-verification
```

Requirements:

-   rate limiting
-   generic response
-   invalidate or supersede previous tokens where appropriate
-   send only when needed

## 8. Password Reset

Endpoint:

``` http
POST /auth/forgot-password
```

The response should not disclose whether an account exists.

Example generic response:

``` json
{
  "message": "If the account exists, a password reset email will be sent."
}
```

## 9. Reset Token

Fields:

``` text
token_hash
expires_at
used_at
user_id
```

Rules:

-   short TTL
-   one-time use
-   hash only
-   invalidate after successful reset

## 10. Reset Flow

``` text
forgot password
→ create token
→ store hash
→ send email

reset password
→ receive token
→ verify hash
→ verify expiry
→ update password
→ mark used
→ revoke sessions
→ audit
```

## 11. Password Changed Notification

An optional notification can be sent after successful password change.

Do not make security notifications block the password update if the
email provider is temporarily unavailable unless the business
requirement explicitly requires transactional mail delivery.

## 12. Mail Failure Strategy

Decide whether mail is:

### Synchronous

Simple for V1:

``` text
API → MailProvider → response
```

### Queued

Better for larger systems:

``` text
API → Queue → Mail Worker → Provider
```

The existing repository has a mail-worker foundation. Keep it only if
the project actually uses a queue.

Do not add a worker merely to make the architecture look complex.

## 13. Rate Limiting

Rate-limit:

-   resend verification
-   forgot password
-   reset attempts

Use Redis for distributed counters when required.

## 14. Enumeration Protection

Avoid responses such as:

``` text
User does not exist.
```

Prefer generic responses.

Timing differences should be considered when implementing password
recovery.

## 15. Email Address Handling

Normalize consistently:

``` text
trim
→ lowercase where policy permits
→ validate
```

Store the canonical form.

Do not make provider-specific assumptions about every possible email
address.

## 16. Security

Never include:

-   password
-   access token
-   refresh token

in email URLs or templates.

Verification/reset URLs should contain only the dedicated short-lived
token.

## 17. Testing

Test:

-   verification email generation
-   token hashing
-   expiration
-   successful verification
-   duplicate verification
-   resend rate limit
-   forgot-password generic response
-   reset success
-   expired reset
-   reused reset
-   mail-provider failure
-   session revocation after reset

## 18. Definition of Done

Mail/verification is complete when:

-   provider abstraction exists
-   verification flow works
-   password reset works
-   tokens are hashed
-   tokens expire
-   tokens are one-time
-   enumeration is minimized
-   rate limits exist
-   templates are versioned
-   sensitive data is not logged
-   tests cover failure paths
