# AuthForge --- Authorization & RBAC

## 1. Purpose

Authentication establishes identity. Authorization establishes
permission.

AuthForge uses Role-Based Access Control (RBAC) with a many-to-many
role/permission model:

``` text
User
  ↓
Roles
  ↓
Permissions
```

## 2. Roles

A role groups permissions.

Example:

``` text
USER
ADMIN
```

The system should allow additional roles later without changing
application architecture.

## 3. Permissions

Use stable identifiers:

``` text
users.read
users.update
sessions.read
sessions.revoke
roles.read
roles.manage
permissions.read
permissions.manage
audit.read
```

Keep permission names machine-readable and unique.

## 4. Database Relationships

``` text
users
  │
  └── user_roles ── roles
                       │
                       └── role_permissions ── permissions
```

Composite uniqueness must prevent duplicate relationships.

## 5. Decorators

Example conceptual usage:

``` ts
@Roles('ADMIN')
@Permissions('roles.manage')
```

Keep decorators declarative. They should not perform database queries.

## 6. Guards

Typical request pipeline:

``` text
JwtAuthGuard
     ↓
RoleGuard / PermissionGuard
     ↓
Controller
```

Authentication failures:

``` text
401 Unauthorized
```

Authorization failures:

``` text
403 Forbidden
```

## 7. Authorization Service

Centralize authorization logic in an `AuthorizationService`.

Responsibilities:

-   load user roles
-   load permissions
-   check role
-   check permission
-   optionally resolve ownership
-   optionally cache authorization state

Do not duplicate permission queries across every controller.

## 8. Default Role

New users should receive a least-privileged role such as:

``` text
USER
```

Do not allow public registration to choose an arbitrary role.

This prevents a mass-assignment privilege escalation such as:

``` json
{
  "email": "...",
  "password": "...",
  "role": "ADMIN"
}
```

The registration DTO must not contain privileged fields.

## 9. Admin Authorization

Administrative endpoints must be protected.

Examples:

``` http
GET    /roles
POST   /roles
PATCH  /roles/:id
DELETE /roles/:id

GET    /permissions
```

Use explicit permissions rather than assuming that any authenticated
user is an administrator.

## 10. Role Management

Creating/updating roles should validate:

-   unique name
-   valid description
-   permission references
-   protected/system roles

Consider preventing accidental deletion of required system roles.

## 11. Permission Management

Permissions are generally system-defined.

A safer V1 approach is:

-   seed permissions
-   allow admins to assign permissions to roles
-   avoid arbitrary runtime creation unless there is a clear product
    requirement

## 12. Object Ownership

RBAC alone is not sufficient for resources that belong to individual
users.

Example:

``` text
User A can read their own session
User A cannot read User B's session
```

The service must verify ownership:

``` text
resource.user_id === currentUser.id
```

before returning or mutating the resource.

## 13. Caching

Redis may cache authorization results.

Possible key:

``` text
authz:user:{userId}
```

But cache invalidation is critical.

Invalidate when:

-   role assigned
-   role removed
-   role permissions changed
-   user permissions change

If cache consistency is uncertain, prefer a database-backed
authorization check.

## 14. Privilege Escalation Controls

Prevent:

-   public role assignment
-   arbitrary permission injection
-   user editing another user's roles
-   role modification without permission
-   hidden admin endpoints
-   client-controlled authorization claims

Never trust a role supplied by the frontend.

## 15. Audit

Audit:

``` text
ROLE_CREATED
ROLE_UPDATED
ROLE_DELETED
ROLE_ASSIGNED
ROLE_REMOVED
PERMISSIONS_CHANGED
```

Include actor and target where appropriate.

## 16. API Authorization Matrix

  Endpoint                 Auth   Permission
  ------------------------ ------ --------------------
  `GET /users/me`          Yes    Authenticated
  `PATCH /users/me`        Yes    Authenticated
  `GET /sessions`          Yes    Own sessions
  `DELETE /sessions/:id`   Yes    Own session
  `GET /roles`             Yes    `roles.read`
  `POST /roles`            Yes    `roles.manage`
  `PATCH /roles/:id`       Yes    `roles.manage`
  `DELETE /roles/:id`      Yes    `roles.manage`
  `GET /permissions`       Yes    `permissions.read`

## 17. Testing

Test:

-   authenticated user
-   unauthenticated user
-   correct role
-   missing role
-   correct permission
-   missing permission
-   resource ownership
-   admin-only routes
-   role assignment
-   permission changes
-   cache invalidation
-   privilege escalation attempts

## 18. Definition of Done

RBAC is complete when:

-   roles exist
-   permissions exist
-   many-to-many relationships work
-   decorators work
-   guards work
-   401/403 behavior is correct
-   admin endpoints are protected
-   ownership checks exist where needed
-   default role cannot be client-controlled
-   audit events exist
-   security tests pass
