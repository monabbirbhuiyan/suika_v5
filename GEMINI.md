# GEMINI.md — Suika Soft SaaS Development & Architectural Blueprint

Welcome to the **Suika Soft SaaS** core development guidelines and workspace context. This document acts as the definitive single source of truth (SSoT) for Gemini (and other advanced LLM developers) to ensure perfect context alignment, zero-error execution, and consistent architectural adherence across the entire software development lifecycle (SDLC).

---

## 1. Context & Architectural Identity

### 1.1 Core Mission
Suika Soft develops high-performance, enterprise-grade Software-as-a-Service (SaaS) platforms focused on exceptional user experience (UX), robust data privacy, ultra-low latency, and horizontally scalable microservices.

### 1.2 Technological Stack Focus
When generating code, provisioning scripts, or architectural designs, strictly adhere to the following stack layers unless explicitly overridden:
*   **Runtime & Package Manager:** Bun (for execution, building, and dependency management).
*   **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack Query (v5).
*   **Backend:** Node.js/Bun (TypeScript) with NestJS **OR** Go (Golang) for high-throughput microservices.
*   **Database:** PostgreSQL (with Prisma ORM) for relational operational data; Redis for distributed caching and session management.
*   **Infrastructure:** AWS (ECS Fargate, RDS, ElastiCache, S3), Terraform for IaC, Docker for containerization (using official Bun base images).
*   **CI/CD & Testing:** GitHub Actions with strict automated linting, `bun test` for unit/integration testing, and staging deployments.

---

## 2. Universal Code & Implementation Principles

To guarantee smooth development with **no errors**, every piece of code generated must follow these mandatory paradigms:

### 2.1 Type Safety & Compilation Guarantees
*   **No `any`:** The use of `any` in TypeScript is strictly forbidden. Use proper generic interfaces, unions, or `unknown` with type guards.
*   **Strict Null Checks:** Always handle `null` and `undefined` states explicitly. Utilize optional chaining (`?.`) and nullish coalescing (`??`) defensively.
*   **Bun-Native Typing:** Utilize Bun's native types (e.g., `Bun.File`, `Bun.Serve`) when handling files or HTTP streams directly to optimize memory footprints.

### 2.2 Asynchronous & Concurrent Safety
*   **Race Conditions:** Protect shared mutable states using proper locking mechanisms (e.g., Mutexes in Go, transaction isolation levels in PostgreSQL).
*   **Unhandled Promises:** Every promise must be awaited or explicitly caught using `.catch()`. Floating promises are disallowed.
*   **Connection Resilience:** Implement automatic exponential backoff retry mechanisms for all external network requests and database connections.

### 2.3 Idempotency & State Consistency
*   **API Design:** All write operations (POST, PUT, DELETE) must support idempotency keys (`Idempotency-Key` header) to avoid double-processing during network blips.
*   **Database Transactions:** Operations spanning multiple database tables must be wrapped in ACID-compliant transactions. If a sub-operation fails, a complete rollback must trigger.

---

## 3. Bun-Specific Execution Guardrails

To leverage Bun’s speed without creating environment discrepancies, follow these strict execution rules:

### 3.1 Lockfile and Tooling Consistency
*   **Lockfile Ownership:** `bun.lockb` is the exclusive lockfile. Do not generate `package-lock.json` or `yarn.lock`.
*   **Commands:** Always use Bun CLI equivalents:
    *   Dependency Installation: `bun add <package>` / `bun add -d <package>`
    *   Script Execution: `bun run <script>`
    *   Testing: `bun test`

### 3.2 Testing Paradigms (`bun test`)
*   When generating unit or integration tests, strictly use `bun:test` modules (`describe`, `test`, `expect`, `mock`). Do not inject Jest or Mocha frameworks.
*   Ensure all mocks clean up after themselves using `mock.restore()` or lifecycle hooks (`afterEach`).

### 3.3 Containerization (Dockerfile)
*   Always use the official ecosystem image for building production containers: `oven/bun:alpine` as the base image to reduce final production attack vectors and image size.

---

## 4. Error Handling Blueprint

A major source of production bugs is unhandled or uninformative errors. Suika Soft utilizes a standardized error classification system.

### 4.1 Standardized Error Format
All application errors must map to this schema before returning to the client:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested organization project could not be located.",
    "timestamp": "2026-06-08T12:46:00Z",
    "trackingId": "err_suika_9a8b7c6d"
  }
}
```

### 4.2 Categorization Matrix
| Error Category | HTTP Status | Internal Code Base | Handling Strategy |
| :--- | :--- | :--- | :--- |
| **Validation Error** | 400 Bad Request | `INVALID_INPUT_DATA` | Reject instantly, return fields with validation details. |
| **Authentication** | 401 Unauthorized | `AUTH_TOKEN_EXPIRED` | Clear session cookies, prompt re-authentication token. |
| **Authorization** | 403 Forbidden | `INSUFFICIENT_PERMISSIONS` | Log security event, return access-denied view. |
| **Resource Missing**| 404 Not Found | `RESOURCE_NOT_FOUND` | Graceful UI fallback, do not crash downstream services. |
| **Rate Limiting** | 429 Too Many Requests| `RATE_LIMIT_EXCEEDED` | Apply backoff headers (`Retry-After`), throttle client. |
| **Server Failures** | 500 Internal Error | `INTERNAL_SERVER_ERROR` | Trigger PagerDuty/Alert, scrub stack trace from client response. |

---

## 5. API & Integration Standards

### 5.1 RESTful Conventions
*   **Resource Naming:** Use plural nouns for endpoints (e.g., `/api/v1/organizations`, `/api/v1/billing/invoices`).
*   **Versioning:** Always prepend versioning prefixes to endpoints (`/v1/`, `/v2/`).
*   **Pagination:** High-volume endpoints must use cursor-based pagination (`limit`, `starting_after`) rather than offset-based to ensure stable performance.

### 5.2 Security Assertions
*   **JWT Validation:** Validate tokens on every protected route. Use asymmetric encryption (RS256) where public keys rotate dynamically.
*   **Data Sanitization:** Sanitize all incoming payloads against XSS, and explicitly leverage ORM parameterized queries to block SQL Injection.
*   **CORS:** Restrict Cross-Origin Resource Sharing exclusively to verified Suika Soft domains.

---

## 6. Deployment, CI/CD, & Environments

### 6.1 Environment Disconnect
Never hardcode secrets, URIs, or credentials. Use strict environment variable validation at application initialization. (Note: Bun natively loads `.env` files automatically, but strict type schemas like `zod` must still validate them at startup).
*   `Development`: Local configuration, verbose logging, mocking enabled for external vendor APIs (Stripe, SendGrid).
*   `Staging`: Exact replica of production topology using sanitized production data snapshots.
*   `Production`: Highly restricted, Multi-AZ deployment, automated horizontal scaling based on CPU/Memory thresholds.

### 6.2 Zero-Downtime Strategy
*   All deployments must utilize **Blue-Green** or **Rolling Update** strategies.
*   **Database Migrations:** Migrations must always be additive. Never drop columns or rename tables in a way that breaks running older container versions. Use a multi-step deploy pattern: *Add column -> Write to both -> Migrate old data -> Deprecate old column*.

---

## 7. Rules for LLM Context Generation (Prompt Guardrails)

When generating code files or templates based on this file:
1.  **Do Not Invent Syntaxes:** Write vanilla, modern, production-ready syntax according to the stack specified in Section 1.2.
2.  **Include Completeness:** Do not truncate scripts with comments like `// TODO: Implement the rest here`. Write out structural boilerplate, validation, and error paths entirely.
3.  **Optimize for Bun Runtime:** Use native Web API globals (like `fetch`, `WebSocket`, `Request`, `Response`) which Bun optimizes natively, avoiding outdated Node.js polyfills.
4.  **Assume High Concurrency:** Always assume code will execute in a high-traffic environment with thousands of concurrent users. Optimize loops, prevent memory leaks, and close database handles promptly.

---
*Document Version: 1.1.0*  
*Last Updated: June 8, 2026*  
*Suika Soft Engineering Operations*