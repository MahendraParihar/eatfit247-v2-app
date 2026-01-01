# server_1 — Backend Architecture & Development Guide

This document is the **single source of truth** for the `server_1` backend project.
It explains **how the codebase is structured**, **why it is structured this way**, and **the strict rules that must be followed** to keep the system scalable, performant, and free of circular dependencies.

---

## 1. Project Overview

* **Monorepo Tooling:** Nx
* **Framework:** NestJS
* **ORM:** Sequelize (sequelize-typescript)
* **Languages:** TypeScript
* **APIs:** REST

The project supports:

* Admin-facing APIs
* Public-facing APIs
* 70+ database tables
* Heavy JOIN usage
* Strict dependency boundaries

---

## 2. Applications

```
apps/
├── admin-api    # Admin-facing APIs
└── public-api   # Public-facing APIs
```

### Responsibilities

* Apps are **thin shells**
* Apps:

    * Wire modules together
    * Configure global middleware
    * DO NOT contain business logic

---

## 3. High-Level Architecture (MANDATORY)

The system follows a **strict layered architecture**:

```
shared-dto
   ↑
  core
   ↑
 platform
   ↑
 modules (features)
   ↑
 admin-only
   ↑
 apps
```

### Golden Rule

> **Dependencies may only flow UPWARD.**

Any downward or sideways dependency will break Nx builds.

---

## 4. Libraries Overview

### 4.1 shared-dto

```
libs/shared-dto/
```

**Purpose:**

* DTOs
* Enums
* Interfaces

**Rules:**

* ❌ No NestJS
* ❌ No Sequelize
* ❌ No services
* ✅ Pure TypeScript

---

### 4.2 core

```
libs/core/
```

**Purpose (Infrastructure ONLY):**

* Database bootstrap (Sequelize `forRoot`)
* Authentication (JWT, guards)
* Interceptors
* Filters
* Config

**STRICT RULES:**

* ❌ Must NOT import platform
* ❌ Must NOT import modules
* ❌ Must NOT import admin-only
* ❌ Must NOT register domain models

If core needs something → it does **not** belong in core.

---

### 4.3 platform

```
libs/platform/
```

**Purpose:**

* Cross-domain infrastructure & master data

**Owns:**

* `mst_*` master tables (countries, states, payment modes, etc.)
* Email templates
* Labels
* Error logging

**Rules:**

* ✅ Can import core
* ❌ Must NOT import feature modules

---

### 4.4 feature modules (`libs/modules/*`)

```
libs/modules/
├── blogs
├── member
├── assessment
├── recipe
├── payment
└── ...
```

**Purpose:**

* Business domains

Each feature module owns:

* Its models
* Its services
* Its controllers

**Rules:**

* ❌ Feature must NOT import another feature
* ❌ Feature must NOT import admin-only
* ✅ Feature may import core, platform, shared-dto

---

### 4.5 admin-only

```
libs/admin-only/
├── admin-user
└── reports
```

**Purpose:**

* Admin-exclusive features

**Rules:**

* Only `admin-api` may import admin-only modules
* Admin-only may depend on features/platform/core

---

## 5. Sequelize JOIN STRATEGY (CRITICAL)

This project **supports FULL SQL JOINs** without circular dependencies.

### ❌ FORBIDDEN (causes Nx cycles)

```ts
import { MstAdminUser } from '@admin-only/admin-user';
```

---

### ✅ REQUIRED (SAFE JOIN PATTERN)

Use **string-based Sequelize associations**:

```ts
@BelongsTo('MstAdminUser', {
  foreignKey: 'created_by',
  constraints: false,
})
createdBy?: any;
```

**Why this works:**

* Sequelize resolves models by name at runtime
* Nx sees no TypeScript dependency
* JOINs remain single-query and performant

---

### Query Example

```ts
this.blogRepo.findAll({
  include: [{
    model: 'MstAdminUser',
    attributes: ['admin_user_id', 'name'],
  }],
});
```

---

## 6. Audit Fields Pattern

For all tables with audit columns:

```ts
created_by
updated_by
approved_by
```

### RULE

* Store **IDs only**
* Use string-based `@BelongsTo`
* Never import admin-user model

---

## 7. Master Tables Pattern (`mst_*`)

* All master tables live in **platform**
* Generated using Nx generator `master-table`

Example:

```bash
nx g master-table religion
```

Features reference masters using IDs + string joins.

---

## 8. Nx Dependency Enforcement (LOCKED)

This repo uses **Nx depConstraints** to enforce architecture.

### Rules enforced:

* core → shared-dto only
* platform → core, shared-dto
* feature → platform, core, shared-dto
* admin-only → feature, platform, core
* apps → everything

Any violation fails lint/build.

---

## 9. Generators (MANDATORY USAGE)

### Feature module

```bash
nx g feature-module blog
```

### Master table

```bash
nx g master-table blood-sugar
```

**Manual creation of modules is discouraged.**

---

## 10. Common Mistakes (DO NOT DO THESE)

❌ Importing models across features
❌ Importing platform into core
❌ Creating global model registries
❌ Manual service-level joins (N+1 queries)
❌ Bypassing Nx depConstraints

---

## 11. Validation Checklist (Before PR)

```bash
nx build core
nx build platform
nx build admin-api
nx build public-api
nx graph
```

PRs must show:

* No circular dependencies
* No forbidden imports

---

## 12. Final Note

This architecture is **intentional and locked**.

If you feel tempted to break a rule:

1. Stop
2. Re-read this README
3. Refactor the code instead

---

✅ This repo is now:

* Nx-safe
* JOIN-efficient
* Scalable to 100+ tables
* Ready for microservices

**Do not weaken these rules.**
