# PotionPulse — Development Roadmap & Antigravity Execution Plan

**Companion document to:** `PRD.md`  
**Primary IDE/agent environment:** Google Antigravity  
**Team:** 2–3 members  
**Workflow:** Structured GitHub branches, pull requests, issue tracking and code reviews  
**Release objective:** A working web + Android inventory intelligence product that satisfies every official Track 01 requirement before optional SaaS expansion.

---

## 1. Execution Principles

1. **Build a vertical slice early.** A user must be able to create an ingredient, receive stock, record a sale, and see the same balance from web and Android before advanced modules begin.
2. **Backend owns business truth.** Clients display and request operations; they do not independently calculate authoritative inventory.
3. **One source of truth.** `PRD.md` defines product behavior and contracts. Update it when a decision changes.
4. **Parallelize only independent work.** Frontend screens can be built against agreed API contracts while backend modules are implemented, but integration must happen continuously.
5. **Test after each phase.** Do not defer all integration testing to the end.
6. **Protect the official scoring path.** Forecast accuracy, anomalies, web + Android functionality and UX outrank optional CRM, billing or marketplace work.
7. **No fake functionality.** Every visible action must work or be explicitly labelled as unavailable/not in this release.
8. **Keep deterministic demo data.** Seed scripts and evaluation cases must produce repeatable results.

## 2. Team Responsibilities

For a 2–3 person team, use ownership with shared reviews. One person may cover more than one role.

| Workstream | Primary owner | Secondary/reviewer |
|---|---|---|
| Product integration, architecture, API contracts, deployment | Member A — Technical lead/backend | Member C |
| Web UI, design system, web E2E | Member B — Web lead | Member A |
| Android client, API integration, Android smoke tests | Member C — Mobile lead (if 3 members) | Member A |
| Forecasting, anomaly detection, evaluation | Member A + Member C | Member B for visualization |
| QA, demo script, documentation and GitHub hygiene | Shared; assign one coordinator | All |

If there are only two members: Member A owns backend + data/ML + deployment; Member B owns web + Android UI using shared components/contracts where possible. Both review integration-critical changes.

## 3. GitHub Workflow

### 3.1 Branch strategy
- `main`: always deployable; protected.
- `develop`: integration branch if the team can manage it; otherwise use short-lived feature branches directly from `main`.
- Feature branches: `feat/inventory-ledger`, `feat/forecast-api`, `feat/android-inventory`, `fix/tenant-scope`, `test/midnight-curse`.

### 3.2 Pull request rules
- One logical feature per PR.
- PR description includes requirement IDs, screenshots or API examples, test results and known limitations.
- At least one teammate reviews auth, tenant scoping, stock mutation, forecast math and event logic.
- Never merge failing typecheck/lint/unit tests.
- No secrets, `.env`, private keys, provider credentials or user data in commits.
- Tag each evaluation-ready build with a commit hash.

### 3.3 Issue labels
`P0-mandatory`, `P1-important`, `P2-future`, `backend`, `web`, `android`, `ml`, `database`, `security`, `qa`, `blocked`, `good-first-task`.

## 4. Antigravity Agent Workflow

Use Antigravity as the primary coding environment. Assign specialized roles through separate tasks or agents, but keep one integration owner responsible for merging and validating the result.

### 4.1 Suggested agent roles
1. **Architect/Planner:** reads PRD, proposes implementation order, checks dependencies and identifies contradictions. Does not edit code until contracts are approved.
2. **Backend Agent:** NestJS modules, DTOs, services, MongoDB models, auth, tenant isolation and API tests.
3. **Web Agent:** Next.js routes, design system, forms, tables, charts and API integration.
4. **Android Agent:** React Native/Expo screens, secure auth storage, API integration and mobile tests.
5. **Data/ML Agent:** dataset inspection, time-series preparation, baselines, evaluation, stockout/reorder calculations and anomaly tests.
6. **QA/Reviewer Agent:** reviews diffs, runs tests, checks PRD traceability, security and acceptance criteria.

Do not let multiple agents modify the same critical file or shared API contract simultaneously. Give each task an explicit file/module boundary and require the agent to report files changed, tests run, assumptions and unresolved issues.

### 4.2 Standard Antigravity task prompt

```text
You are implementing one bounded task in PotionPulse.

Before editing:
1. Read PRD.md and DEVELOPMENT_ROADMAP.md.
2. Identify the relevant requirement IDs and dependencies.
3. Inspect the existing repository and reuse established patterns.
4. Do not rewrite unrelated modules or invent new product behavior.

Implementation rules:
- Follow the PRD and existing API contracts.
- Keep tenant isolation and authorization server-enforced.
- Do not duplicate authoritative business logic in clients.
- Do not add placeholder controls or fake production data.
- Use strict TypeScript and the project's existing lint/format conventions.
- Add or update tests for the behavior being changed.
- Do not expose secrets or commit environment values.
- If a requirement is ambiguous, stop and document the smallest safe assumption rather than silently expanding scope.

Before finishing:
1. Run relevant tests, lint and typecheck.
2. Review the diff for unrelated changes and security issues.
3. Update API/docs/contracts if they changed.
4. Report: summary, files changed, tests run/results, requirement IDs satisfied, known limitations and next dependency.
```

### 4.3 Integration checkpoint prompt

```text
Act as PotionPulse's integration and QA lead. Compare the current repository against PRD.md and the current roadmap phase.
Verify that each claimed feature has a real UI action, API implementation, persistence behavior, authorization rule and test. Check API/schema consistency, tenant scoping, inventory ledger invariants, idempotency, concurrent updates, forecast calculations and cross-platform behavior. Run the available checks. Do not make broad refactors. Return a prioritized defect list with exact files and reproduction steps, then fix only the defects approved for this checkpoint.
```

## 5. Phased Development Plan

### Phase 0 — Repository bootstrap and contract freeze
**Objective:** Establish a runnable project and shared engineering conventions.

Tasks:
- Create repository and baseline README.
- Choose monorepo or clearly coordinated repositories.
- Initialize Next.js + TypeScript + Tailwind.
- Initialize NestJS + TypeScript.
- Initialize Android app with React Native/Expo unless the team confirms native Kotlin.
- Add formatting, lint, typecheck, environment templates and CI.
- Define API envelope, auth model, tenant context, ID/timestamp conventions and shared types.
- Add PRD and roadmap to `/docs`.

Dependencies: none.  
Deliverables: all apps boot locally; health endpoint responds; CI checks run.  
Exit criteria: a clean clone can install and start each application using documented steps.

### Phase 1 — Database foundation and tenant isolation
**Objective:** Establish reliable data boundaries before business features.

Tasks:
- Configure MongoDB Atlas/local replica-set-compatible environment.
- Implement users, tenants, memberships, locations and ingredient models.
- Add tenant-scoped repository helpers and indexes.
- Implement migrations/seed scripts.
- Add cross-tenant access tests.
- Implement audit event abstraction.

Dependencies: Phase 0.  
Deliverables: database models, indexes, seed data, tenant context.  
Exit criteria: tenant A cannot read or mutate tenant B records through any tested repository/API path.

### Phase 2 — Authentication and onboarding
**Objective:** Users can sign in and create/select a shop.

Tasks:
- Email registration/login and Google auth integration.
- Secure session/token refresh and logout.
- Tenant creation and membership resolution.
- Role guards and permission matrix.
- Onboarding flow: shop details, timezone, currency, units, sample data choice.

Dependencies: Phase 1.  
Deliverables: working auth in web and Android; owner workspace creation.  
Exit criteria: owner can sign in from both clients and resolve the same active tenant.

### Phase 3 — Inventory ledger (highest priority)
**Objective:** Make stock tracking correct and auditable.

Tasks:
- Ingredient CRUD.
- Location/shelf CRUD or seeded locations.
- Inventory balance model.
- Immutable stock movement service.
- Transactional movement + balance update.
- Idempotency keys and concurrency/version checks.
- Manual adjustment reason and audit trail.
- Inventory list/detail endpoints.

Dependencies: Phases 1–2.  
Deliverables: create ingredient, receive stock, adjust stock, view balance/history.  
Exit criteria: ledger-derived balance equals materialized balance; duplicate and concurrent write tests pass.

### Phase 4 — Sales and consumption
**Objective:** Record demand and deduct inventory consistently.

Tasks:
- Sales and sale-item models.
- Record sale API and validation.
- Sale line item to stock movement linkage.
- Refund semantics and reversals.
- Daily demand aggregation.
- Sample sale generator for repeatable data.

Dependencies: Phase 3.  
Deliverables: sale flow and consumption history.  
Exit criteria: sale records and stock deductions are atomic and auditable.

### Phase 5 — Web MVP vertical slice
**Objective:** Provide the first complete browser experience.

Tasks:
- Sign-in and onboarding.
- Overview dashboard shell.
- Ingredient list/create/edit/detail.
- Receive/adjust stock forms.
- Record sale flow.
- Movement history table.
- API loading/error/empty states.
- Responsive layout and design tokens.

Dependencies: Phases 2–4; can be developed in parallel against frozen API contracts.  
Deliverables: functional web inventory operations.  
Exit criteria: AT-01 through AT-06 pass via web.

### Phase 6 — Android MVP vertical slice
**Objective:** Demonstrate a working Android client on the same backend.

Tasks:
- Auth and tenant selection.
- Home summary.
- Inventory list/detail.
- Ingredient add/edit.
- Receive/adjust stock.
- Record sale.
- API error and network states; disable mutations offline.
- Secure token storage and app configuration.

Dependencies: Phases 2–4; API contract stable.  
Deliverables: installable Android build.  
Exit criteria: AT-01 through AT-06 pass on Android; a stock mutation from web is visible on Android after refresh and vice versa.

### Phase 7 — Forecasting and evaluation
**Objective:** Generate defensible demand predictions.

Tasks:
- Inspect released sample data and document schema/quality.
- Normalize quantities and aggregate time buckets.
- Build deterministic baseline(s).
- Implement chronological train/validation/holdout split.
- Compare candidate methods using MAE, RMSE, WAPE and bias.
- Persist forecast metadata and points.
- Build forecast API and charts.
- Add low-data fallback and confidence/data-sufficiency labels.

Dependencies: Phase 4.  
Deliverables: per-ingredient forecast and evaluation report.  
Exit criteria: forecast generation is reproducible; no future-data leakage; model beats or is compared transparently against baseline where evidence supports it.

### Phase 8 — Stockout and reorder intelligence
**Objective:** Turn forecasts into actionable decisions.

Tasks:
- Supplier lead-time and safety-stock inputs.
- Days-of-cover calculation.
- Stockout date calculation.
- Reorder quantity formula.
- Incoming stock handling.
- MOQ/pack-size rounding.
- Explanation breakdown UI/API.

Dependencies: Phase 7 and inventory/PO data.  
Deliverables: risk-ranked stockout and reorder list.  
Exit criteria: hand-calculated fixtures match API output exactly.

### Phase 9 — Anomaly detection
**Objective:** Catch meaningful unusual consumption and discrepancies.

Tasks:
- Rolling robust baseline and MAD/robust z-score.
- Minimum observation/volume guardrails.
- Ledger reconciliation job.
- Anomaly persistence, severity and evidence.
- Acknowledge/resolve workflow.
- Labelled synthetic anomaly fixtures and precision/recall report.

Dependencies: Phases 3–4 and data aggregation.  
Deliverables: anomaly center and tests.  
Exit criteria: expected synthetic cases are detected and normal/event-explained cases are not indiscriminately flagged.

### Phase 10 — Midnight Curse
**Objective:** Pass the special seasonal demand challenge.

Tasks:
- Event model and CRUD.
- Configure three affected ingredient IDs and 3.0 multiplier.
- Baseline versus event-adjusted forecast storage/display.
- Recompute stockout and reorder calculations.
- Event start/end handling and expiry.
- Demo scenario script.

Dependencies: Phases 7–9.  
Deliverables: event impact visualization and updated recommendations.  
Exit criteria: only three selected ingredients and only event-window dates receive the multiplier; historical sales remain unchanged; event expiration restores baseline behavior.

### Phase 11 — Analytics, notifications and extended modules
**Objective:** Improve product completeness without endangering core stability.

Tasks, in order:
1. Dashboard KPIs and demand analytics.
2. In-app notifications and deduplication.
3. WebSocket refresh events.
4. Email/push if credentials are available.
5. Suppliers and purchase orders.
6. Recipes and production deduction.
7. CSV import/export.
8. Batch/expiry, wastage and customer/order extensions.

Dependencies: core phases complete.  
Exit criteria: every exposed feature is functional and has tests; otherwise hide/defer it.

### Phase 12 — Hardening, deployment and presentation
**Objective:** Produce a reliable, judge-ready build.

Tasks:
- Run full acceptance suite and security tests.
- Test tenant isolation and role boundaries.
- Verify API docs and database indexes.
- Deploy web/API/database and verify health.
- Build Android release APK/AAB and smoke test.
- Run seeded demo and evaluation scripts from a clean state.
- Capture architecture diagram and screenshots.
- Prepare README with setup, architecture, libraries/models/APIs and evaluation method.
- Prepare 8-minute presentation and 4-minute Q&A plan.
- Tag final commit and push before official code freeze.

Exit criteria: no critical defect, all mandatory tests pass, both clients work against deployed backend, demo can be repeated without manual database editing.

## 6. Hackathon Night Critical Timeline

The official brief supplies these checkpoints:

| Time | Official checkpoint | PotionPulse target |
|---|---|---|
| 8:00 PM | Opening ceremony / track reveal | Confirm dataset format, team roles, repository and task board. |
| 12:00 AM | Midnight Curse revealed | Inspect exact affected ingredients/date rules and configure event scenario. |
| 1:00 AM | Round 1 — architecture and baseline check | Database + CRUD working; web and Android connected to backend. |
| 3:00 AM | Break | Stabilize, backup, review logs and prepare public test run. |
| 4:00 AM | Round 2 — public metrics and curse progress | Show forecasting baseline, anomaly progress and event adjustment. |
| 6:45 AM | Code freeze | Push and tag only the tested final commit before freeze. |
| 7:00 AM | Round 3 — hidden tests | Do not rely on last-minute uncommitted changes; verify frozen build. |
| ~8:30 AM | Top 10 announced | Prepare presentation only if selected; retain fallback demo. |
| 9:30 AM | Final presentation | 8-minute presentation + 4-minute judge Q&A. |

**Hard rule:** The official brief says the team must be present with a working build at every evaluation round; missing a round scores zero for that round. Only the commit pushed before 6:45 AM is evaluated. Schedule internal deadlines at least 10–15 minutes before each official checkpoint.

## 7. Demo and Judging Script

### 7.1 Core story
“PotionPulse does not just show how much stock remains. It predicts what will run out, explains why, recommends what to reorder, and catches unusual changes — with the same live data on web and Android.”

### 7.2 8-minute presentation structure
| Time | Demonstration |
|---|---|
| 0:00–0:45 | Problem and product positioning. |
| 0:45–1:45 | Create/view ingredient and show shelf-level stock ledger. |
| 1:45–2:30 | Record sale and show automatic stock deduction. |
| 2:30–3:30 | Show forecast chart, stockout date and evaluation methodology. |
| 3:30–4:20 | Show reorder recommendation and transparent calculation. |
| 4:20–5:10 | Trigger or inspect anomaly and explain evidence. |
| 5:10–6:15 | Activate Midnight Curse: three ingredients, 3× demand, updated risk/reorder. |
| 6:15–7:00 | Show same inventory state in Android and web. |
| 7:00–8:00 | Architecture, measured metrics, limitations and impact. |

### 7.3 Judge evidence checklist
- Web URL and Android build ready.
- Test account credentials available through a safe demo handout, not hard-coded publicly.
- Seed/reset script.
- Example stock movement ledger.
- Forecast chart and metrics report.
- Anomaly scenario and evidence.
- Midnight Curse event with exactly three ingredients.
- Cross-platform synchronization proof.
- Architecture diagram.
- README with all third-party libraries, pretrained models and public APIs declared.

### 7.4 Fallback plan
- If network fails, show a pre-recorded demo video and screenshots, but clearly disclose that they are fallback evidence; do not claim a live operation succeeded.
- If forecast service fails, show the last persisted forecast with timestamp and model metadata; never fabricate fresh predictions.
- If push/email credentials are unavailable, demonstrate in-app notifications.
- If a full Android release build is delayed, use the latest tested installable build and demonstrate the shared backend; do not substitute a mobile web page while claiming it is Android.

## 8. Evaluation Harness

Create deterministic scripts and fixtures:
- `seed-demo`: create tenant, roles, ingredients, locations, stock, sales, suppliers and events.
- `reset-demo`: clear only demo tenant records and recreate seed.
- `evaluate-forecast`: run chronological holdout and output per-ingredient MAE/RMSE/WAPE/bias plus baseline comparison.
- `evaluate-anomalies`: run labelled normal/spike/discrepancy fixtures and output precision/recall.
- `simulate-midnight-curse`: configure three ingredient IDs, multiplier 3.0 and event interval; assert expected adjusted values.
- `smoke-api`: auth, tenant context, CRUD, movement, sale, forecast and anomaly health checks.
- `smoke-android`: login, view stock, post stock operation and verify backend result.

Evaluation outputs must include dataset version/hash, split dates, model version, configuration and execution timestamp. Never tune on hidden test labels.

## 9. Quality Gates and Release Checkpoints

| Gate | Required checks | Must not proceed if |
|---|---|---|
| G0 Bootstrap | Apps run, lint/typecheck, CI | Repository cannot be built from clean clone. |
| G1 Data/security | Tenant-scoped models, cross-tenant tests | Any tenant leak or missing auth guard. |
| G2 Inventory | Ledger, transaction, idempotency, concurrency tests | Balance can diverge or duplicate writes mutate stock twice. |
| G3 Cross-platform | Web + Android share backend and complete core flow | One client is only a mock/prototype. |
| G4 Intelligence | Forecast baseline, stockout/reorder fixtures, anomaly cases | Outputs cannot be reproduced or explained. |
| G5 Curse | Exact 3× event behavior and historical immutability | Multiplier affects wrong ingredients/dates or is applied twice. |
| G6 Release | Full tests, deployment health, README, demo reset | Critical bug, missing client, untested build or unpushed commit. |

## 10. Definition of Done for Antigravity Tasks

A task is complete only when:
- The relevant PRD requirement IDs are met.
- The feature has a real UI and backend behavior where applicable.
- DTO/schema/API contracts match.
- Tenant and role checks are implemented.
- Loading, empty, error and success states exist.
- Tests cover normal, invalid and important edge cases.
- Lint, typecheck and relevant tests pass.
- No secrets or unrelated changes are included.
- Documentation and roadmap status are updated.
- A teammate has reviewed integration-critical changes.

## 11. Final Readiness Checklist

- [ ] Repository builds from a clean clone.
- [ ] Web app is deployed and functional.
- [ ] Android app is installable and functional.
- [ ] Both clients use the same centralized backend.
- [ ] Ingredient CRUD and shelf-level stock tracking work.
- [ ] Sales and stock movements are auditable and consistent.
- [ ] Forecasting has a baseline and chronological evaluation.
- [ ] Stockout date and reorder quantity are calculated transparently.
- [ ] Anomaly detection has test evidence and false-positive review.
- [ ] Midnight Curse handles exactly three ingredients at 3× for the event window.
- [ ] Historical sales are not altered by event adjustments.
- [ ] Tenant isolation and RBAC tests pass.
- [ ] Demo data and evaluation scripts are reproducible.
- [ ] README declares external libraries, pretrained models and APIs.
- [ ] Final commit is pushed before 6:45 AM code freeze.
- [ ] Presentation and Q&A materials are ready.

---

## Roadmap Readiness Assessment

This roadmap is ready to guide Antigravity agents through implementation. The team must still supply actual kickoff dataset details, the exact three Midnight Curse ingredients and dates once revealed, OAuth/provider credentials, and the final Android build configuration. The roadmap deliberately gates optional modules behind the mandatory judging path so the team can deliver a working end-to-end system before expanding the SaaS feature set.
