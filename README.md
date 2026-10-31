# PotionPulse 🔮

> **Predict. Manage. Thrive.**  
> Multi-tenant Inventory Intelligence Platform for potion shops and small businesses.  
> *Developed for MSOT Halloween Night Hackathon 2026 — Track 01: The Witch's Potion Pantry.*

---

## 1. Overview

PotionPulse solves the fundamental dilemma of small, inventory-led businesses: *having stock today does not guarantee stock tomorrow*. By unifying an immutable transactional stock ledger with explainable time-series demand forecasting, stockout risk prediction, and event-aware intelligence (including the official Midnight Curse 3× spike scenario), PotionPulse ensures shop owners never run out of critical ingredients.

---

## 2. Monorepo Architecture

The repository is organized as a clean npm workspaces monorepo:

```text
PotionPulse/
├── apps/
│   ├── web/                    # Next.js 14 (App Router) + Tailwind CSS dashboard
│   └── android/                # React Native + Expo (SDK 52) mobile client
├── services/
│   ├── api/                    # Node.js + NestJS modular monolith API
│   └── forecasting/            # Statistical time-series forecasting worker
├── packages/
│   ├── contracts/              # Shared TypeScript API schemas, DTOs & envelopes
│   ├── config/                 # Base TypeScript, ESLint, & Prettier configs
│   └── ui-tokens/              # Design tokens (colors, typography, spacing)
├── infrastructure/             # Deployment descriptors, MongoDB scripts & monitoring
├── docs/                       # Architecture, database, AI/ML & API specs
├── tests/                      # Integration, evaluation & E2E test suites
└── scripts/                    # Repeatable seed & evaluation utilities
```

---

## 3. Technology Stack

| Layer | Technology | Role |
|---|---|---|
| **Web Dashboard** | Next.js 14 + Tailwind CSS + TypeScript | Management dashboard, inventory ledger, forecasting charts |
| **Android Client** | React Native + Expo SDK 52 + TypeScript | Mobile stock intake, point-of-sale deductions, risk alerts |
| **Backend API** | Node.js + NestJS + TypeScript | Central source of truth, REST API + Swagger/OpenAPI |
| **Database** | MongoDB Atlas (Replica Set) | Tenant-isolated document stores with ACID transactions |
| **Shared Core** | `@potionpulse/contracts`, `@potionpulse/ui-tokens` | Unified contracts, response envelopes, and design tokens |

---

## 4. Getting Started

### Prerequisites
- **Node.js**: `>= 20.0.0` (LTS recommended)
- **npm**: `>= 10.0.0`
- **MongoDB**: Local replica set or MongoDB Atlas cluster

### Quickstart

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RajJasani/PotionPulse.git
   cd PotionPulse
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Build shared packages & applications:**
   ```bash
   npm run build
   ```

---

## 5. Development Scripts

Run commands from the repository root:

| Command | Action |
|---|---|
| `npm run dev` | Start all workspace applications concurrently |
| `npm run dev:api` | Start NestJS backend API with hot-reload (`http://localhost:4000`) |
| `npm run dev:web` | Start Next.js web application (`http://localhost:3000`) |
| `npm run dev:android` | Start Expo Android development server |
| `npm run build` | Build all packages, services, and applications |
| `npm run typecheck` | Run strict TypeScript checks across all workspaces |
| `npm run lint` | Run ESLint across all workspaces |
| `npm run test` | Run test suites across services |

---

## 6. API Documentation

When the backend API is running (`npm run dev:api`), interactive OpenAPI (Swagger) documentation is available at:

```
http://localhost:4000/api/docs
```

All API routes follow the standard `/api/v1` prefix with standardized JSON envelopes (`ApiSuccessEnvelope` / `ApiErrorEnvelope`).

---

## 7. Security & Isolation

- **Tenant Isolation**: Every database query and business mutation is strictly tenant-scoped server-side.
- **Secret Hygiene**: Real secrets and credentials must remain in `.env` (gitignored). Never commit environment variables or secrets to source control.
- **Source of Truth**: Clients never mutate inventory balances directly; all adjustments, sales, and receipts are recorded as immutable stock movements via the backend API.

---

## 8. License

Proprietary — Developed for MSOT Hackathon 2026. All rights reserved.
