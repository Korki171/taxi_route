# Graph Report - taxi_route-hero  (2026-11-12)

## Corpus Check
- 145 files · ~81,095 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 6, (none) 3, .example 1)

## Summary
- 937 nodes · 3513 edges · 33 communities (25 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `099b6192`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 20261026102414_phase3_marketplace/migration.sql
- errors.ts
- LiveMap.tsx
- marketplace.ts
- actions.ts
- getI18n
- Landing.tsx
- parse
- organizations/[id]/page.tsx
- members.ts
- requirePermission
- Product
- driver.ts
- requirePermission
- vercel.json
- errors.ts
- validation.ts
- ShiftTracker.tsx
- leaflet
- Transferborsa
- password-reset.ts
- dispatch.ts
- Startseite (/)
- test
- package.json
- compilerOptions
- dependencies
- scripts
- CLAUDE.md
- BILDNACHWEISE.md

## God Nodes (most connected - your core abstractions)
1. `requirePermission()` - 88 edges
2. `getI18n` - 84 edges
3. `getActor()` - 63 edges
4. `notFound()` - 58 edges
5. `runAction()` - 51 edges
6. `invalid()` - 48 edges
7. `db` - 43 edges
8. `actorCan()` - 40 edges
9. `next` - 39 edges
10. `parse()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `hashPassword()`  [EXTRACTED]
  prisma/seed.ts → src/server/auth/password.ts
- `addMember()` --calls--> `hashPassword()`  [EXTRACTED]
  tests/helpers.ts → src/server/auth/password.ts
- `createAdmin()` --calls--> `hashPassword()`  [EXTRACTED]
  tests/helpers.ts → src/server/auth/password.ts
- `driver()` --calls--> `loadActor()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/authz/context.ts
- `org()` --calls--> `loadActor()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/authz/context.ts

## Import Cycles
- 2-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/notifications.ts`

## Communities (33 total, 8 thin omitted)

### Community 0 - "20261026102414_phase3_marketplace/migration.sql"
Cohesion: 0.05
Nodes (63): "AuditEvent", AuditEvent_organizationId_createdAt_idx, "Invitation", Invitation_organizationId_idx, Invitation_tokenHash_key, "Membership", Membership_organizationId_idx, Membership_userId_organizationId_key (+55 more)

### Community 1 - "errors.ts"
Cohesion: 0.16
Nodes (17): GET(), GET(), OrgActor, AppError, AppErrorCode, getBookingDocumentForDownload(), listBookingDocuments(), MAX_BOOKING_DOCUMENTS (+9 more)

### Community 2 - "LiveMap.tsx"
Cohesion: 0.13
Nodes (19): ago(), AUSTRIA, Basemap, duration(), esc(), headingOf(), legLabels(), legRoles() (+11 more)

### Community 3 - "marketplace.ts"
Cohesion: 0.08
Nodes (58): vitest, db, globalForPrisma, HANDOFF_SHARE_OPTIONS, HandoffSplit, MAX_HANDOFF_SHARE_PERCENT, estimateMinutes(), loadActor() (+50 more)

### Community 4 - "actions.ts"
Cohesion: 0.10
Nodes (64): acceptInvitationAction(), acceptQuoteAction(), addPartnerAction(), adminReviewCapabilityAction(), adminReviewDocumentAction(), adminSetOrgPlanAction(), adminSetOrgStatusAction(), advanceAudienceAction() (+56 more)

### Community 5 - "getI18n"
Cohesion: 0.05
Nodes (115): nextConfig, next, dynamic, GET(), RequestDetailPage(), stageIndex(), STAGES, NewRequestPage() (+107 more)

### Community 7 - "Landing.tsx"
Cohesion: 0.06
Nodes (45): @fontsource-variable/albert-sans, @fontsource-variable/imbue, react, Datenschutz(), metadata, Impressum(), metadata, NotFound() (+37 more)

### Community 8 - "parse"
Cohesion: 0.13
Nodes (30): at(), driver(), liveFleetDemo(), main(), org(), trail(), hashPassword(), Actor (+22 more)

### Community 11 - "organizations/[id]/page.tsx"
Cohesion: 0.06
Nodes (46): GET(), EN, Locale, LOCALE_COOKIE, LOCALES, makeT(), T, translate() (+38 more)

### Community 12 - "members.ts"
Cohesion: 0.29
Nodes (16): assignableRoles(), conflict(), forbidden(), acceptInvitation(), changeMemberRole(), consumeInvitation(), ensureNotLastOwner(), findOpenInvitation() (+8 more)

### Community 13 - "requirePermission"
Cohesion: 0.33
Nodes (8): zod@^3.25.76, zod, access(), alertSchema, canWrite(), listThreads(), MAX_MESSAGE_LENGTH, sendMessage()

### Community 14 - "Product"
Cohesion: 0.20
Nodes (9): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Purpose (+1 more)

### Community 15 - "driver.ts"
Cohesion: 0.15
Nodes (14): POST(), driverOverview(), endShift(), openShift(), pointSchema, pointsSchema, POSITION_RETENTION_DAYS, POSITION_STALE_SECONDS (+6 more)

### Community 16 - "requirePermission"
Cohesion: 0.17
Nodes (34): bookingTransitionAction(), splitHandoff(), requirePermission(), invalid(), notFound(), notificationFailed(), returnBooking(), deleteDocument() (+26 more)

### Community 18 - "errors.ts"
Cohesion: 0.14
Nodes (28): @prisma/client, AdminOrgPage(), AdminPage(), PlanCell(), STATUSES, TYPES, fmtDate(), fromLocalInput() (+20 more)

### Community 19 - "validation.ts"
Cohesion: 0.13
Nodes (11): countrySchema, emailSchema, memberRoleSchema, orgProfileSchema, passwordSchema, phoneSchema, postalCodeSchema, registrationSchema (+3 more)

### Community 20 - "ShiftTracker.tsx"
Cohesion: 0.38
Nodes (6): Fix, ShiftTracker(), flush(), keepAwake(), onVisible(), TrackerText

### Community 26 - "Transferborsa"
Cohesion: 0.07
Nodes (27): Berechtigungsmodell, Datenmodelle, Gewählte Architektur, Implementierungsplan, Live-Flottenkarte und Fahrer, Offene Fragen (Annahmen getroffen, reversibel), Phase 1: Ist-Zustand (26.10.2026), Phase 4: Reisebüros (Szenario B) (+19 more)

### Community 27 - "password-reset.ts"
Cohesion: 0.15
Nodes (22): db, main(), derive(), verifyPassword(), createSession(), invalidateAllSessions(), invalidateSession(), SESSION_COOKIE (+14 more)

### Community 30 - "dispatch.ts"
Cohesion: 0.16
Nodes (19): GET(), BY_ID, getPlace(), haversineKm(), isPlaceId(), nearestPlace(), Place, Point (+11 more)

### Community 35 - "test"
Cohesion: 0.08
Nodes (25): DATABASE_URL, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, jobs, test, name, on (+17 more)

### Community 38 - "package.json"
Cohesion: 0.11
Nodes (24): description, devDependencies, dotenv-cli@^11.0.0, prisma@^6.19.3, tsx@^4.23.15, @types/leaflet@^1.9.22, @types/node@^22.20.5, @types/react@^19.3.0 (+16 more)

### Community 53 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 62 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, @fontsource-variable/albert-sans@^5.3.0, @fontsource-variable/imbue@^5.3.0, maplibre-gl@^4.7.1, @maplibre/maplibre-gl-leaflet@^0.0.22, next@^15.5.28, pdf-lib@^1.17.1, @prisma/client@^6.19.3 (+8 more)

### Community 76 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:demo, db:deploy, db:migrate, db:seed, dev, lint (+5 more)

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `getI18n` to `actions.ts`, `package.json`, `Landing.tsx`, `organizations/[id]/page.tsx`, `errors.ts`, `ShiftTracker.tsx`, `dependencies`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `20261026102414_phase3_marketplace/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.0528169014084507 - nodes in this community are weakly interconnected._
- **Why does `getI18n` connect `getI18n` to `errors.ts`, `organizations/[id]/page.tsx`, `dispatch.ts`, `Landing.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `LiveMap.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13405797101449277 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `errors.ts` to `marketplace.ts`, `actions.ts`, `getI18n`, `package.json`, `parse`, `organizations/[id]/page.tsx`, `members.ts`, `requirePermission`, `dispatch.ts`, `password-reset.ts`, `dependencies`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `marketplace.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07768744354110207 - nodes in this community are weakly interconnected._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10040705563093623 - nodes in this community are weakly interconnected._