# Graph Report - taxi_route  (2026-11-10)

## Corpus Check
- 127 files · ~72,778 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .css 3, (none) 2, .example 1)

## Summary
- 851 nodes · 3200 edges · 31 communities (25 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `434c45bc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 20261026102414_phase3_marketplace/migration.sql
- LegalPage.tsx
- LiveMap.tsx
- helpers.ts
- actions.ts
- context.ts
- Landing.tsx
- notFound
- organizations/[id]/page.tsx
- members.ts
- getI18n
- matching.ts
- layout.tsx
- escalateDueRequests
- vercel.json
- requirePermission
- Transferborsa
- db.ts
- dispatch.ts
- test
- package.json
- password-reset.ts
- compilerOptions
- dependencies
- scripts
- driver.ts
- CLAUDE.md
- BILDNACHWEISE.md

## God Nodes (most connected - your core abstractions)
1. `getI18n` - 84 edges
2. `requirePermission()` - 76 edges
3. `getActor()` - 56 edges
4. `notFound()` - 50 edges
5. `runAction()` - 46 edges
6. `invalid()` - 41 edges
7. `db` - 39 edges
8. `next` - 38 edges
9. `actorCan()` - 35 edges
10. `Flash()` - 35 edges

## Surprising Connections (you probably didn't know these)
- `setup()` --calls--> `createTransferRequest()`  [EXTRACTED]
  tests/fleet-tracking.test.ts → src/server/services/marketplace.ts
- `setup()` --calls--> `takeFixedPriceRequest()`  [EXTRACTED]
  tests/fleet-tracking.test.ts → src/server/services/marketplace.ts
- `driver()` --calls--> `hashPassword()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/auth/password.ts
- `driver()` --calls--> `loadActor()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/authz/context.ts
- `liveFleetDemo()` --calls--> `recordPositions()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/driver.ts

## Import Cycles
- 2-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/notifications.ts`

## Communities (31 total, 6 thin omitted)

### Community 0 - "20261026102414_phase3_marketplace/migration.sql"
Cohesion: 0.07
Nodes (53): "AuditEvent", AuditEvent_organizationId_createdAt_idx, "Invitation", Invitation_organizationId_idx, Invitation_tokenHash_key, "Membership", Membership_organizationId_idx, Membership_userId_organizationId_key (+45 more)

### Community 1 - "LegalPage.tsx"
Cohesion: 0.21
Nodes (9): Datenschutz(), metadata, Impressum(), metadata, NotFound(), metadata, Nutzungsbedingungen(), BackLink() (+1 more)

### Community 2 - "LiveMap.tsx"
Cohesion: 0.13
Nodes (19): ago(), AUSTRIA, Basemap, duration(), esc(), headingOf(), legLabels(), legRoles() (+11 more)

### Community 3 - "helpers.ts"
Cohesion: 0.26
Nodes (17): vitest, loadActor(), getBookingConfirmation(), registerOrganization(), setup(), addDocument(), addMember(), createAdmin() (+9 more)

### Community 4 - "actions.ts"
Cohesion: 0.06
Nodes (112): at(), driver(), liveFleetDemo(), main(), org(), trail(), acceptInvitationAction(), acceptQuoteAction() (+104 more)

### Community 5 - "context.ts"
Cohesion: 0.15
Nodes (12): Actor, agencyOverview(), transferInclude, TransferRow, transferState(), orgSelect, capacitySchema, createVehicle() (+4 more)

### Community 7 - "Landing.tsx"
Cohesion: 0.08
Nodes (27): react@^19.1.1, react, ClaimOrder(), Labels, CardSpec, ChatScene(), Confirmation(), FAQ (+19 more)

### Community 8 - "notFound"
Cohesion: 0.17
Nodes (23): GET(), requirePlatformAdmin(), notFound(), adminGetOrganization(), adminReviewCapability(), adminReviewDocument(), adminSetOrganizationPlan(), adminSetOrganizationStatus() (+15 more)

### Community 11 - "organizations/[id]/page.tsx"
Cohesion: 0.06
Nodes (41): GET(), EN, Locale, LOCALE_COOKIE, LOCALES, makeT(), T, translate() (+33 more)

### Community 12 - "members.ts"
Cohesion: 0.23
Nodes (18): assignableRoles(), AppError, AppErrorCode, conflict(), forbidden(), acceptInvitation(), changeMemberRole(), consumeInvitation() (+10 more)

### Community 13 - "getI18n"
Cohesion: 0.06
Nodes (120): nextConfig, next, AdminOrgPage(), AdminPage(), PlanCell(), STATUSES, TYPES, RequestDetailPage() (+112 more)

### Community 14 - "matching.ts"
Cohesion: 0.26
Nodes (10): estimateMinutes(), categoryFits(), findMatchesForCapacity(), listCapacityWithMatches(), matchCapacity(), MatchInput, MatchResult, RequestForMatch (+2 more)

### Community 15 - "layout.tsx"
Cohesion: 0.25
Nodes (6): @fontsource-variable/albert-sans@^5.3.0, @fontsource-variable/imbue@^5.3.0, @fontsource-variable/albert-sans, @fontsource-variable/imbue, generateMetadata(), RootLayout()

### Community 16 - "escalateDueRequests"
Cohesion: 0.40
Nodes (5): dynamic, GET(), advance(), escalateDueRequests(), nextAudience()

### Community 19 - "requirePermission"
Cohesion: 0.31
Nodes (11): requirePermission(), getTransferRequest(), listInvitations(), getPublicOrganizationProfile(), addPartner(), advanceAudience(), listPartnerCandidates(), listPartners() (+3 more)

### Community 26 - "Transferborsa"
Cohesion: 0.07
Nodes (27): Berechtigungsmodell, Datenmodelle, Gewählte Architektur, Implementierungsplan, Live-Flottenkarte und Fahrer, Offene Fragen (Annahmen getroffen, reversibel), Phase 1: Ist-Zustand (26.10.2026), Phase 4: Reisebüros (Szenario B) (+19 more)

### Community 29 - "db.ts"
Cohesion: 0.15
Nodes (14): @prisma/client, db, globalForPrisma, Tx, requestCapabilityReview(), DEFAULT_CAPABILITIES, missingTransportDocuments(), countrySchema (+6 more)

### Community 30 - "dispatch.ts"
Cohesion: 0.10
Nodes (28): GET(), BY_ID, getPlace(), haversineKm(), isPlaceId(), nearestPlace(), Place, PLACES (+20 more)

### Community 35 - "test"
Cohesion: 0.08
Nodes (25): DATABASE_URL, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, jobs, test, name, on (+17 more)

### Community 38 - "package.json"
Cohesion: 0.11
Nodes (24): description, devDependencies, dotenv-cli@^11.0.0, prisma@^6.19.3, tsx@^4.23.15, @types/leaflet@^1.9.22, @types/node@^22.20.5, @types/react@^19.3.0 (+16 more)

### Community 43 - "password-reset.ts"
Cohesion: 0.15
Nodes (25): db, main(), zod, derive(), hashPassword(), verifyPassword(), createSession(), invalidateAllSessions() (+17 more)

### Community 53 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 62 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, leaflet@^1.9.4, maplibre-gl@^4.7.1, @maplibre/maplibre-gl-leaflet@^0.0.22, next@^15.5.28, pdf-lib@^1.17.1, @prisma/client@^6.19.3, react-dom@^19.1.1 (+8 more)

### Community 76 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:demo, db:deploy, db:migrate, db:seed, dev, lint (+5 more)

### Community 123 - "driver.ts"
Cohesion: 0.14
Nodes (16): POST(), OrgActor, listDispatchBookings(), listDrivers(), driverOverview(), openShift(), pointSchema, pointsSchema (+8 more)

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `getI18n` to `LegalPage.tsx`, `actions.ts`, `package.json`, `Landing.tsx`, `organizations/[id]/page.tsx`, `layout.tsx`, `escalateDueRequests`, `dependencies`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `20261026102414_phase3_marketplace/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Why does `getI18n` connect `getI18n` to `LegalPage.tsx`, `Landing.tsx`, `organizations/[id]/page.tsx`, `layout.tsx`, `dispatch.ts`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `LiveMap.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13405797101449277 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `db.ts` to `helpers.ts`, `actions.ts`, `context.ts`, `package.json`, `notFound`, `password-reset.ts`, `organizations/[id]/page.tsx`, `getI18n`, `matching.ts`, `members.ts`, `requirePermission`, `dispatch.ts`, `dependencies`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05564738292011019 - nodes in this community are weakly interconnected._
- **Should `Landing.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08199643493761141 - nodes in this community are weakly interconnected._