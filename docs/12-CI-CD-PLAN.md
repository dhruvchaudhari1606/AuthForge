# AuthForge --- CI/CD Plan

## 1. Goal

CI/CD should prove that every change is:

-   formatted/linted
-   tested
-   buildable
-   deployable

The pipeline should remain understandable rather than becoming an
unnecessarily complex DevOps showcase.

## 2. Recommended Pipeline

``` text
Push / Pull Request
        ↓
Install
        ↓
Lint
        ↓
Unit Tests
        ↓
Integration/E2E
        ↓
Build
        ↓
Docker Build
        ↓
Security Checks
        ↓
Deploy
```

## 3. Pull Request Checks

Required:

``` bash
npm ci
npm run lint
npm run test
npm run test:e2e
npm run build
```

Use the actual repository scripts where already defined.

## 4. Dependency Caching

Cache npm dependencies using the CI platform's supported cache
mechanism.

Prefer `npm ci` for reproducible installs.

## 5. Test Services

If integration/E2E tests require PostgreSQL and Redis, CI should start
isolated service containers.

Example conceptual setup:

``` text
CI runner
 ├── Node
 ├── PostgreSQL
 └── Redis
```

## 6. Database Migration Test

CI should verify that migrations work from a clean database.

Flow:

``` text
start PostgreSQL
→ run migrations
→ seed required test data
→ run integration/E2E tests
```

## 7. Build Validation

Run:

``` bash
npm run build
```

This catches TypeScript/module/build errors that unit tests may not
catch.

## 8. Docker Build

Build the production image in CI:

``` bash
docker build -t authforge:${GIT_SHA} .
```

Do not deploy an image that was never successfully built in CI.

## 9. Security Checks

Useful automated checks:

-   dependency vulnerability scan
-   secret scanning
-   container image scanning
-   lint/static analysis

Security scanners should be configured with sensible failure thresholds.

## 10. Deployment Environments

Recommended:

``` text
development
staging
production
```

For a portfolio project, a single staging/demo deployment may be
sufficient.

## 11. Environment Secrets

Store separately:

``` text
DATABASE_PASSWORD
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
SMTP_PASSWORD
SENTRY_DSN
```

Never put secrets in repository YAML.

## 12. Deployment Strategy

A simple deployment can be:

``` text
main branch
→ CI
→ Docker image
→ registry
→ deploy
→ migration
→ health check
```

For a small project, avoid Kubernetes unless it is specifically part of
the learning objective.

## 13. Migration Safety

Database migration should be a controlled deployment step.

Do not automatically run destructive migrations without review.

Prefer backward-compatible changes for rolling deployments.

## 14. Rollback

Document:

-   application rollback
-   image rollback
-   migration rollback strategy
-   backup/restore procedure

Database rollback is not always equivalent to application rollback.

## 15. Branch Strategy

A simple approach:

``` text
main
feature/*
fix/*
```

Pull requests merge into `main` after CI passes.

## 16. Release Strategy

Optional:

``` text
v1.0.0
v1.1.0
```

Tag meaningful portfolio milestones.

## 17. Example GitHub Actions Structure

``` text
.github/
└── workflows/
    ├── ci.yml
    └── deploy.yml
```

`ci.yml` should handle validation.

`deploy.yml` should handle deployment after required checks.

## 18. CI Failure Policy

Fail the pipeline on:

-   TypeScript build failure
-   lint failure if lint is enforced
-   critical test failure
-   required security failure

Do not hide failures to make the badge green.

## 19. Definition of Done

CI/CD is complete when:

-   pull requests run validation
-   tests use isolated dependencies
-   build succeeds
-   Docker image builds
-   secrets are externalized
-   deployment process is documented
-   health checks verify deployment
-   rollback strategy is documented
