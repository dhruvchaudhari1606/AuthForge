# 🛡️ Security Policy — AuthForge

AuthForge is a production-oriented authentication and identity service designed with concurrency safety, defensive security practices, and strict cryptographic hygiene. We take the security of AuthForge and the applications relying on it seriously.

This document outlines our security practices, supported versions, and the process for responsibly reporting vulnerabilities.

---

## 📋 Supported Versions

We actively provide security patches and updates for the following versions of AuthForge:

| Version | Supported          | Security Patches |
| :------ | :----------------- | :--------------- |
| `0.0.x` | :white_check_mark: | Active support   |
| `main`  | :white_check_mark: | Active support   |
| `< 0.0.1` | :x:              | Unsupported      |

---

## 🚨 Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

If you discover or suspect a security vulnerability in AuthForge, we ask that you disclose it responsibly using one of the following methods:

### 1. GitHub Private Vulnerability Reporting (Preferred)
Submit a confidential report directly via GitHub:
1. Navigate to the **[Security tab](https://github.com/dhruvchaudhari1606/AuthForge/security)** of the repository.
2. Click **"Advisories"** and then **"Report a vulnerability"**.
3. Fill out the report form with all relevant technical details.

### 2. Direct Security Contact
If GitHub Private Reporting is unavailable, send an email to our security maintainer:
- **Contact**: `dhruv.chaudhari1606@gmail.com`
- **Subject Line**: `[SECURITY] Vulnerability Report — AuthForge — <Brief Summary>`

---

## 📝 What to Include in Your Report

To help us investigate, triage, and resolve the issue quickly, please provide as much context as possible:

- **Vulnerability Category**: (e.g., JWT verification bypass, token reuse evasion, pessimistic lock race condition, privilege escalation, timing attack, cryptographic defect, injection).
- **Affected Component(s)**: Specific controllers, services, middleware, guards, or migration scripts (e.g., `SessionService`, `AuthService`, `JwtAuthGuard`).
- **Steps to Reproduce**: Detailed, step-by-step instructions or automated scripts (cURL, Postman, Jest test) demonstrating the vulnerability.
- **Proof of Concept (PoC)**: Minimal working exploit or scenario demonstrating the security impact without destructive payload execution.
- **Impact Assessment**: What an attacker could achieve (e.g., unauthorized session generation, token replay, account takeover, data leak).
- **Mitigation / Suggested Fix** (Optional): If you have identified a code or configuration patch, feel free to include it.

---

## ⏱️ Response Timelines & SLAs

We follow a structured vulnerability response workflow:

| Stage | Expected SLA | Description |
| :--- | :--- | :--- |
| **Initial Acknowledgement** | Within 24–48 hours | Confirmation that the report was received and assigned for triage. |
| **Triage & Assessment** | Within 3–5 business days | Reproduction of the issue, severity scoring (CVSS), and impact verification. |
| **Fix Development & Testing** | Within 7–14 business days | Patch creation, regression testing, and verification across test suites. |
| **Release & Public Disclosure** | Coordinated | Release of hotfix/patch release alongside a public CVE / GitHub Security Advisory, crediting the reporter. |

---

## 🛡️ Scope & Vulnerability Classifications

### In Scope
- **Authentication & Session Bypasses**: Bypassing token validation, refresh token rotation evasion, or session lock race conditions.
- **Privilege Escalation**: Unauthorized role acquisition or circumventing dynamic RBAC permission checks.
- **Cryptographic Weaknesses**: Insecure token entropy, weak password hashing algorithms, predictable tokens, or flawed crypto operations.
- **Data Leakage**: Exposure of plaintext passwords, active refresh tokens, or PII via API responses, logs, or error dumps.
- **Injection Attacks**: SQL injection (TypeORM query safety), command injection, or unauthorized header injection.
- **Rate-Limiting Bypasses**: Circumventing authentication and brute-force throttling mechanisms.

### Out of Scope
The following areas are considered out of scope unless they demonstrate a direct, high-impact compromise of the application core:
- Attacks requiring physical device access or root privileges on the user's client device.
- Theoretical attacks without actionable proof-of-concept.
- Volumetric Denial of Service (DoS/DDoS) attacks against network infrastructure.
- Issues in third-party hosted dependencies without direct exploitability in AuthForge.
- Social engineering, phishing, or physical security attacks against maintainers or contributors.
- Missing HTTP security headers on unsupported non-production test environments without real-world exploitability.

---

## 🏅 Security Recognition & Disclosure

We believe in responsible, coordinated disclosure:
- Once a fix is verified and deployed, we will publish a **GitHub Security Advisory** detailing the vulnerability and recommended upgrade path.
- Unless you request to remain anonymous, we will gladly credit you in the advisory and release notes for your responsible disclosure and contribution to project security.

Thank you for helping keep **AuthForge** secure!
