# AuthForge --- Implementation Plan

## 1. Goal

Implement AuthForge incrementally so every phase leaves the repository
buildable and testable.

The project should be built in the following order:

``` text
Foundation
→ Database
→ Authentication
→ Sessions
→ Password/Email
→ Authorization
→ Security hardening
→ API
→ Testing
→ Infrastructure
→ CI/CD
→ Documentation
```

## 2. Phase 0 --- Baseline

Tasks:

-   inspect current repository
-   create a migration branch
-   confirm Node/npm versions
-   run existing tests
-   run lint
-   run build
-   run Docker
-   document baseline behavior

Definition of done:

-   baseline commands and failures are known
-   no architecture is changed yet

## 3. Phase 1 --- Repository Cleanup

-   remove unrelated modules
-   clean imports
-   clean dependencies
-   clean environment variables
-   clean Docker services
-   update module registration
-   preserve common infrastructure

## 4. Phase 2 --- Database

Implement:

-   BaseEntity
-   User
-   Session
-   Role
-   Permission
-   UserRole
-   RolePermission
-   PasswordReset
-   EmailVerification
-   AuditLog

Add:

-   constraints
-   indexes
-   foreign keys
-   migrations
-   seed data

## 5. Phase 3 --- Configuration

Implement validated configuration for:

-   application
-   database
-   Redis
-   JWT
-   cookies
-   CORS
-   mail
-   rate limiting
-   Swagger
-   Sentry

## 6. Phase 4 --- Password Service

Implement:

-   secure password hashing
-   password verification
-   password policy
-   password change
-   password reset

Do not log passwords or tokens.

## 7. Phase 5 --- Registration

Implement:

``` http
POST /auth/register
```

Flow:

``` text
Request
→ DTO validation
→ normalize email
→ check account
→ hash password
→ create user
→ assign default role
→ create verification token
→ send verification email
→ audit event
→ response
```

## 8. Phase 6 --- Login

Implement:

``` http
POST /auth/login
```

Flow:

``` text
Credentials
→ validate
→ password verify
→ account-status check
→ create session
→ generate access token
→ generate refresh token
→ hash refresh token
→ persist session
→ set HTTP-only cookies
→ audit login
```

## 9. Phase 7 --- Refresh

Implement:

``` http
POST /auth/refresh
```

Required behavior:

-   validate refresh JWT
-   identify session
-   lock session row where necessary
-   compare token hash
-   rotate refresh token
-   invalidate old token
-   issue new tokens
-   detect reuse
-   revoke session on reuse

## 10. Phase 8 --- Logout and Session Management

Implement:

``` http
POST /auth/logout
POST /auth/logout-all
GET  /sessions
DELETE /sessions/:id
DELETE /sessions
```

Support multiple devices.

## 11. Phase 9 --- Email Verification

Implement:

``` http
POST /auth/verify-email
POST /auth/resend-verification
```

Requirements:

-   hashed token
-   expiration
-   one-time use
-   rate limiting
-   audit logging

## 12. Phase 10 --- Password Recovery

Implement:

``` http
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/change-password
```

Use enumeration-resistant responses.

## 13. Phase 11 --- Authorization

Implement:

-   roles
-   permissions
-   decorators
-   guards
-   authorization service
-   admin endpoints

Default roles may include:

``` text
USER
ADMIN
```

Keep the system extensible.

## 14. Phase 12 --- Security

Implement:

-   Helmet/security headers
-   CORS
-   rate limits
-   cookie hardening
-   CSRF strategy appropriate to the deployment
-   proxy-aware IP handling
-   input validation
-   log redaction
-   Sentry
-   dependency security review

## 15. Phase 13 --- API Layer

Implement:

-   DTOs
-   controllers
-   response contracts
-   errors
-   pagination
-   Swagger
-   request IDs
-   status codes
-   API versioning strategy

## 16. Phase 14 --- Tests

Minimum:

-   unit tests for password/token/session/auth/authorization services
-   integration tests for persistence
-   E2E tests for critical user journeys

Critical journey:

``` text
register
→ verify email
→ login
→ access protected route
→ refresh
→ logout
→ login again
→ password reset
→ session revocation
```

## 17. Phase 15 --- Infrastructure

Implement:

-   Dockerfile
-   docker-compose
-   PostgreSQL
-   Redis
-   health checks
-   production-like environment
-   graceful shutdown

## 18. Phase 16 --- CI/CD

Pipeline:

``` text
install
→ lint
→ unit tests
→ integration/e2e tests
→ build
→ Docker build
→ optional security scan
→ deploy
```

## 19. Phase 17 --- Documentation

Complete:

-   architecture
-   setup
-   environment variables
-   API documentation
-   security model
-   Docker
-   tests
-   CI/CD
-   screenshots
-   README

## 20. Suggested 87-Task Breakdown

### Foundation

1.  Baseline build
2.  Baseline tests
3.  Baseline Docker
4.  Repository cleanup
5.  Dependency cleanup
6.  Environment cleanup

### Database

7.  Base entity
8.  User entity
9.  Session entity
10. Role entity
11. Permission entity
12. User-role entity
13. Role-permission entity
14. Password reset entity
15. Email verification entity
16. Audit entity
17. Relationships
18. Indexes
19. Constraints
20. Migration
21. Seeder

### Auth

22. Password service
23. JWT service
24. Cookie service
25. Registration DTO
26. Registration service
27. Login DTO
28. Login service
29. Access-token guard
30. Refresh strategy
31. Refresh endpoint
32. Logout
33. Logout-all

### Sessions

34. Session creation
35. Session listing
36. Session revoke
37. Token hash storage
38. Rotation
39. Reuse detection
40. Concurrency protection
41. Expiration cleanup

### Recovery

42. Forgot password
43. Reset password
44. Change password
45. Verification token
46. Verify email
47. Resend verification
48. Mail templates

### Authorization

49. Role decorator
50. Permission decorator
51. Role guard
52. Permission guard
53. Authorization service
54. Role APIs
55. Permission APIs
56. Admin protection
57. Cache/invalidation

### Security

58. Validation pipe
59. CORS
60. Helmet
61. Rate limiting
62. CSRF strategy
63. Request ID
64. Proxy/IP handling
65. Audit logging
66. Sentry
67. Secret review

### API

68. Response model
69. Error model
70. Pagination
71. Swagger
72. API versioning
73. endpoint documentation

### Tests

74. Auth unit tests
75. Token tests
76. Session tests
77. Authorization tests
78. Password tests
79. Integration tests
80. Auth E2E
81. RBAC E2E

### Infrastructure

82. Docker
83. Health checks
84. CI
85. Production build
86. README
87. final security/quality review

## 21. Rule for Every Task

For each task:

1.  inspect existing code
2.  identify the correct module
3.  implement the smallest coherent change
4.  add/update tests
5.  run lint/build/tests
6.  update documentation if behavior changed
7.  commit

Do not implement the entire application in one generated response.

## 22. Definition of Done

AuthForge is complete when the application is secure enough for a
serious portfolio demonstration, reproducible locally, tested,
documented, Dockerized and understandable without the original developer
present.
