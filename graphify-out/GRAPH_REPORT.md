# Graph Report - taxi_route-hero  (2026-11-10)

## Corpus Check
- 143 files · ~80,831 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .css 5, (none) 3, .example 1)

## Summary
- 930 nodes · 3494 edges · 35 communities (28 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cc4c3767`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 20261026102414_phase3_marketplace/migration.sql
- requirePermission
- LiveMap.tsx
- marketplace.ts
- actions.ts
- boerse/page.tsx
- auftrag/[id]/page.tsx
- invalid
- organizations/[id]/page.tsx
- getI18n
- messages.ts
- Product
- notFound
- organization/page.tsx
- vercel.json
- Landing.tsx
- helpers.ts
- partners.ts
- AppShell.tsx
- escalateDueRequests
- context.ts
- Transferborsa
- members.ts
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
- `main()` --calls--> `createVehicle()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/fleet.ts
- `setup()` --calls--> `createVehicle()`  [EXTRACTED]
  tests/fleet-tracking.test.ts → src/server/services/fleet.ts
- `at()` --calls--> `fromLocalInput()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/lib/format.ts
- `liveFleetDemo()` --calls--> `recordPositions()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/driver.ts

## Import Cycles
- 2-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/notifications.ts`

## Communities (35 total, 7 thin omitted)

### Community 0 - "20261026102414_phase3_marketplace/migration.sql"
Cohesion: 0.05
Nodes (63): "AuditEvent", AuditEvent_organizationId_createdAt_idx, "Invitation", Invitation_organizationId_idx, Invitation_tokenHash_key, "Membership", Membership_organizationId_idx, Membership_userId_organizationId_key (+55 more)

### Community 1 - "requirePermission"
Cohesion: 0.19
Nodes (25): requirePermission(), requirePlatformAdmin(), adminGetOrganization(), adminListOrganizations(), adminReviewCapability(), adminReviewDocument(), adminSetOrganizationPlan(), adminSetOrganizationStatus() (+17 more)

### Community 2 - "LiveMap.tsx"
Cohesion: 0.13
Nodes (19): ago(), AUSTRIA, Basemap, duration(), esc(), headingOf(), legLabels(), legRoles() (+11 more)

### Community 3 - "marketplace.ts"
Cohesion: 0.10
Nodes (24): estimateMinutes(), BoardFilter, boardFilterSchema, BOOKING_TO_REQUEST, MarketRequest, marketSelect, MAX_INVITATIONS, OPEN_FOR_MARKET() (+16 more)

### Community 4 - "actions.ts"
Cohesion: 0.10
Nodes (66): acceptInvitationAction(), acceptQuoteAction(), addPartnerAction(), adminReviewCapabilityAction(), adminReviewDocumentAction(), adminSetOrgPlanAction(), adminSetOrgStatusAction(), advanceAudienceAction() (+58 more)

### Community 5 - "boerse/page.tsx"
Cohesion: 0.14
Nodes (37): BoersePage(), BookingsView(), CapacityMarketView(), CHIP_HIDDEN, FILTER_KEYS, GROUPS, InvitationsView(), MarketView() (+29 more)

### Community 7 - "auftrag/[id]/page.tsx"
Cohesion: 0.14
Nodes (33): RequestDetailPage(), stageIndex(), STAGES, NewRequestPage(), DriverPage(), metadata, navUrl(), NEXT_STEP (+25 more)

### Community 8 - "invalid"
Cohesion: 0.18
Nodes (13): driverOverview(), endShift(), openShift(), pointSchema, pointsSchema, POSITION_RETENTION_DAYS, POSITION_STALE_SECONDS, purgeOldPositions() (+5 more)

### Community 11 - "organizations/[id]/page.tsx"
Cohesion: 0.06
Nodes (48): GET(), cache, df(), fmtDateTime(), fmtTime(), tag(), EN, Locale (+40 more)

### Community 12 - "getI18n"
Cohesion: 0.19
Nodes (21): nextConfig, next, InvitePage(), LoginPage(), MembersPage(), ROLE_HELP, ForgotPasswordPage(), ResetPasswordPage() (+13 more)

### Community 13 - "messages.ts"
Cohesion: 0.32
Nodes (9): forbidden(), access(), alertSchema, canWrite(), listThreads(), MAX_MESSAGE_LENGTH, sendMessage(), updateJobAlerts() (+1 more)

### Community 14 - "Product"
Cohesion: 0.20
Nodes (9): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Purpose (+1 more)

### Community 15 - "notFound"
Cohesion: 0.20
Nodes (31): at(), liveFleetDemo(), main(), trail(), bookingTransitionAction(), invalid(), notFound(), notificationFailed() (+23 more)

### Community 16 - "organization/page.tsx"
Cohesion: 0.13
Nodes (27): AdminOrgPage(), AdminPage(), PlanCell(), STATUSES, TYPES, NoOrg(), ALL_CAPS, fmtDate() (+19 more)

### Community 18 - "Landing.tsx"
Cohesion: 0.05
Nodes (44): @fontsource-variable/albert-sans@^5.3.0, @fontsource-variable/imbue@^5.3.0, @fontsource-variable/albert-sans, @fontsource-variable/imbue, react, generateMetadata(), RootLayout(), Home() (+36 more)

### Community 19 - "helpers.ts"
Cohesion: 0.20
Nodes (21): driver(), org(), vitest, hashPassword(), loadActor(), getBookingConfirmation(), DEFAULT_CAPABILITIES, registerOrganization() (+13 more)

### Community 20 - "partners.ts"
Cohesion: 0.21
Nodes (15): conflict(), getTransferRequest(), ownVehicleId(), scopeSnapshot(), addPartner(), advance(), advanceAudience(), blockOrg() (+7 more)

### Community 21 - "AppShell.tsx"
Cohesion: 0.13
Nodes (15): Datenschutz(), metadata, Impressum(), metadata, NotFound(), metadata, Nutzungsbedingungen(), generateMetadata() (+7 more)

### Community 22 - "escalateDueRequests"
Cohesion: 0.67
Nodes (3): dynamic, GET(), escalateDueRequests()

### Community 23 - "context.ts"
Cohesion: 0.11
Nodes (25): @prisma/client, db, globalForPrisma, isPlaceId(), Actor, OrgActor, transferInclude, Tx (+17 more)

### Community 26 - "Transferborsa"
Cohesion: 0.07
Nodes (27): Berechtigungsmodell, Datenmodelle, Gewählte Architektur, Implementierungsplan, Live-Flottenkarte und Fahrer, Offene Fragen (Annahmen getroffen, reversibel), Phase 1: Ist-Zustand (26.10.2026), Phase 4: Reisebüros (Szenario B) (+19 more)

### Community 27 - "members.ts"
Cohesion: 0.07
Nodes (49): zod@^3.25.76, db, main(), zod, GET(), GET(), POST(), derive() (+41 more)

### Community 30 - "dispatch.ts"
Cohesion: 0.10
Nodes (26): GET(), BY_ID, getPlace(), haversineKm(), nearestPlace(), Place, Point, ROAD_FACTOR (+18 more)

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
Nodes (16): dependencies, leaflet@^1.9.4, maplibre-gl@^4.7.1, @maplibre/maplibre-gl-leaflet@^0.0.22, next@^15.5.28, pdf-lib@^1.17.1, @prisma/client@^6.19.3, react@^19.1.1 (+8 more)

### Community 76 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:demo, db:deploy, db:migrate, db:seed, dev, lint (+5 more)

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `getI18n` to `actions.ts`, `boerse/page.tsx`, `package.json`, `auftrag/[id]/page.tsx`, `organizations/[id]/page.tsx`, `organization/page.tsx`, `Landing.tsx`, `AppShell.tsx`, `escalateDueRequests`, `dependencies`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Should `20261026102414_phase3_marketplace/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.0528169014084507 - nodes in this community are weakly interconnected._
- **Why does `getI18n` connect `getI18n` to `boerse/page.tsx`, `auftrag/[id]/page.tsx`, `organizations/[id]/page.tsx`, `organization/page.tsx`, `Landing.tsx`, `AppShell.tsx`, `dispatch.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `LiveMap.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13405797101449277 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `context.ts` to `requirePermission`, `marketplace.ts`, `actions.ts`, `package.json`, `auftrag/[id]/page.tsx`, `organizations/[id]/page.tsx`, `getI18n`, `messages.ts`, `notFound`, `organization/page.tsx`, `helpers.ts`, `partners.ts`, `dispatch.ts`, `members.ts`, `dependencies`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `marketplace.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10344827586206896 - nodes in this community are weakly interconnected._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0959079283887468 - nodes in this community are weakly interconnected._