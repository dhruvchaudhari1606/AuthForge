# AuthForge --- API Documentation Plan

## 1. API Standard

Use RESTful HTTP APIs with JSON request/response bodies.

Swagger/OpenAPI should be available at:

``` text
/api/docs
```

Use the repository's configured Swagger path if it differs.

## 2. API Versioning

Choose one explicit strategy.

Recommended:

``` text
/api/v1/...
```

If the existing repository already uses NestJS URI versioning, keep it
consistent.

Do not mix multiple versioning strategies without a reason.

## 3. Authentication Endpoints

``` http
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/logout-all
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/verify-email
POST /auth/resend-verification
POST /auth/change-password
```

## 4. User Endpoints

``` http
GET   /users/me
PATCH /users/me
```

## 5. Session Endpoints

``` http
GET    /sessions
DELETE /sessions/:id
DELETE /sessions
```

## 6. Authorization Endpoints

``` http
GET    /roles
POST   /roles
PATCH  /roles/:id
DELETE /roles/:id

GET    /permissions
```

Additional user-role management endpoints may be added if required.

## 7. Health

``` http
GET /health
```

## 8. DTO Design

Each endpoint should have explicit DTOs.

Example:

``` text
RegisterDto
LoginDto
RefreshTokenDto if required
ForgotPasswordDto
ResetPasswordDto
ChangePasswordDto
VerifyEmailDto
UpdateProfileDto
CreateRoleDto
UpdateRoleDto
```

DTOs should expose only accepted input.

Never bind entities directly to request bodies.

## 9. Validation

Global validation:

``` ts
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});
```

Validate:

-   email
-   password
-   UUIDs
-   enum values
-   pagination
-   search/filter values

## 10. Response Model

Use a consistent response structure if it matches the existing
application.

Example:

``` json
{
  "success": true,
  "data": {},
  "message": "Success",
  "requestId": "..."
}
```

Do not add an envelope solely for decoration. Consistency is more
important than the exact shape.

## 11. Error Model

Recommended:

``` json
{
  "success": false,
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": {},
  "requestId": "..."
}
```

Do not expose stack traces or internal SQL errors.

## 12. Status Codes

Typical:

``` text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
```

Use the same convention consistently.

## 13. Cookies

Document:

``` text
access_token
refresh_token
```

Swagger should explain that authentication is cookie-based.

Never document raw token values as response fields if the implementation
only sets cookies.

## 14. Pagination

For list endpoints:

``` text
page
limit
```

Optional response:

``` json
{
  "items": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Apply maximum limits.

## 15. Filtering and Sorting

Only allow known fields.

Bad:

``` text
?sortBy=<arbitrary SQL>
```

Good:

``` text
allowed sort fields = createdAt, lastActiveAt
```

Map API field names to safe database fields.

## 16. Request ID

Generate or accept a trusted correlation/request ID according to
deployment policy.

Use it in:

-   logs
-   errors
-   audit correlation
-   support/debugging

Do not trust arbitrary forwarded identity headers without proxy
configuration.

## 17. IP and User-Agent

Use request metadata for:

-   session metadata
-   rate limiting
-   audit

Configure trusted proxy behavior correctly before using forwarded IP
headers.

## 18. Idempotency

Consider idempotency for operations where duplicate requests could have
meaningful side effects.

Examples:

-   future payment operations
-   potentially expensive administrative operations

For simple authentication endpoints, idempotency is not required
everywhere.

## 19. Security Matrix

  Endpoint          Auth                 Authorization
  ----------------- -------------------- ---------------------
  Register          No                   Public
  Login             No                   Public
  Refresh           Refresh cookie       Session
  Logout            Yes                  Own session
  Logout all        Yes                  Own sessions
  Forgot password   No                   Public + rate limit
  Reset password    Reset token          Token
  Verify email      Verification token   Token
  Change password   Yes                  Self
  Get profile       Yes                  Self
  Update profile    Yes                  Self
  List sessions     Yes                  Self
  Revoke session    Yes                  Own session
  Roles             Yes                  `roles.read`
  Manage roles      Yes                  `roles.manage`
  Permissions       Yes                  `permissions.read`

## 20. Swagger Documentation

Every endpoint should document:

-   summary
-   description
-   request body
-   parameters
-   success response
-   error responses
-   authentication requirement
-   examples

Schemas should have useful field descriptions and examples.

## 21. Controller Rules

Controllers should:

-   accept validated DTOs
-   obtain request context
-   call services
-   map service results to response DTOs
-   set/clear cookies where appropriate

Controllers should not:

-   hash passwords
-   perform SQL
-   implement token rotation
-   contain authorization business logic
-   send emails directly

## 22. API Testing

Every documented endpoint should have at least one happy-path test and
important failure tests.

Swagger and actual behavior must remain synchronized.

## 23. Definition of Done

API documentation is complete when:

-   all V1 endpoints are listed
-   DTOs are documented
-   auth behavior is documented
-   cookies are documented
-   status codes are consistent
-   errors are documented
-   Swagger is usable
-   E2E tests match the API contract
