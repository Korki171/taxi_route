# Graph Report - taxi_route  (2026-11-09)

## Corpus Check
- 121 files · ~66,794 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .css 3, (none) 2, .example 1)

## Summary
- 817 nodes · 3056 edges · 27 communities (22 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e4d037d4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 20261026102414_phase3_marketplace/migration.sql
- next
- LiveMap.tsx
- marketplace.ts
- actions.ts
- AgencyOverview.tsx
- ShiftTracker.tsx
- requirePermission
- organizations/[id]/page.tsx
- boerse/page.tsx
- getI18n
- auftrag/[id]/page.tsx
- Transferborsa
- organizations/[id]/page.tsx
- dispatch.ts
- test
- package.json
- password-reset.ts
- compilerOptions
- dependencies
- scripts
- AppShell.tsx
- CLAUDE.md
- BILDNACHWEISE.md

## God Nodes (most connected - your core abstractions)
1. `getI18n` - 84 edges
2. `requirePermission()` - 69 edges
3. `getActor()` - 52 edges
4. `notFound()` - 47 edges
5. `runAction()` - 42 edges
6. `invalid()` - 38 edges
7. `next` - 37 edges
8. `db` - 37 edges
9. `Flash()` - 35 edges
10. `actorCan()` - 35 edges

## Surprising Connections (you probably didn't know these)
- `at()` --calls--> `fromLocalInput()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/lib/format.ts
- `main()` --calls--> `publishCapacity()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/fleet.ts
- `main()` --calls--> `setCapacityStatus()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/fleet.ts
- `driver()` --calls--> `hashPassword()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/auth/password.ts
- `liveFleetDemo()` --calls--> `assignBooking()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/dispatch.ts

## Import Cycles
- 2-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/notifications.ts`

## Communities (27 total, 5 thin omitted)

### Community 0 - "20261026102414_phase3_marketplace/migration.sql"
Cohesion: 0.07
Nodes (53): "AuditEvent", AuditEvent_organizationId_createdAt_idx, "Invitation", Invitation_organizationId_idx, Invitation_tokenHash_key, "Membership", Membership_organizationId_idx, Membership_userId_organizationId_key (+45 more)

### Community 1 - "next"
Cohesion: 0.08
Nodes (27): nextConfig, @fontsource-variable/albert-sans, @fontsource-variable/imbue, next, Datenschutz(), metadata, Impressum(), metadata (+19 more)

### Community 2 - "LiveMap.tsx"
Cohesion: 0.13
Nodes (19): ago(), AUSTRIA, Basemap, duration(), esc(), headingOf(), legLabels(), legRoles() (+11 more)

### Community 3 - "marketplace.ts"
Cohesion: 0.07
Nodes (73): at(), driver(), liveFleetDemo(), main(), org(), trail(), vitest, db (+65 more)

### Community 4 - "actions.ts"
Cohesion: 0.10
Nodes (58): acceptInvitationAction(), acceptQuoteAction(), adminReviewCapabilityAction(), adminReviewDocumentAction(), adminSetOrgPlanAction(), adminSetOrgStatusAction(), advanceTripAction(), assignBookingAction() (+50 more)

### Community 5 - "AgencyOverview.tsx"
Cohesion: 0.39
Nodes (7): AgencyOverview(), TransferTable(), OrgActor, agencyOverview(), transferInclude, TransferRow, transferState()

### Community 7 - "ShiftTracker.tsx"
Cohesion: 0.38
Nodes (6): Fix, ShiftTracker(), flush(), keepAwake(), onVisible(), TrackerText

### Community 8 - "requirePermission"
Cohesion: 0.08
Nodes (75): zod, GET(), POST(), Actor, requirePermission(), requirePlatformAdmin(), assignableRoles(), AppError (+67 more)

### Community 11 - "organizations/[id]/page.tsx"
Cohesion: 0.07
Nodes (44): GET(), cache, df(), fmtDate(), fmtDateTime(), fmtTime(), tag(), Locale (+36 more)

### Community 13 - "boerse/page.tsx"
Cohesion: 0.16
Nodes (39): BoersePage(), BookingsView(), CapacityMarketView(), CHIP_HIDDEN, FILTER_KEYS, GROUPS, InvitationsView(), MarketView() (+31 more)

### Community 18 - "getI18n"
Cohesion: 0.29
Nodes (14): InvitePage(), LoginPage(), MembersPage(), ROLE_HELP, ForgotPasswordPage(), ResetPasswordPage(), RegisterPage(), AuthLayout() (+6 more)

### Community 19 - "auftrag/[id]/page.tsx"
Cohesion: 0.20
Nodes (17): RequestDetailPage(), stageIndex(), STAGES, NewRequestPage(), DirectoryEntry, PlaceSelect(), ProviderPicker(), VehicleSelect() (+9 more)

### Community 26 - "Transferborsa"
Cohesion: 0.07
Nodes (27): Berechtigungsmodell, Datenmodelle, Gewählte Architektur, Implementierungsplan, Live-Flottenkarte und Fahrer, Offene Fragen (Annahmen getroffen, reversibel), Phase 1: Ist-Zustand (26.10.2026), Phase 4: Reisebüros (Szenario B) (+19 more)

### Community 29 - "organizations/[id]/page.tsx"
Cohesion: 0.16
Nodes (24): @prisma/client, AdminOrgPage(), AdminPage(), PlanCell(), STATUSES, TYPES, ALL_CAPS, CAPABILITY_LABEL (+16 more)

### Community 30 - "dispatch.ts"
Cohesion: 0.06
Nodes (36): GET(), EN, BY_ID, getPlace(), haversineKm(), isPlaceId(), nearestPlace(), Place (+28 more)

### Community 35 - "test"
Cohesion: 0.08
Nodes (25): DATABASE_URL, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, jobs, test, name, on (+17 more)

### Community 38 - "package.json"
Cohesion: 0.11
Nodes (24): description, devDependencies, dotenv-cli@^11.0.0, prisma@^6.19.3, tsx@^4.23.15, @types/leaflet@^1.9.22, @types/node@^22.20.5, @types/react@^19.3.0 (+16 more)

### Community 43 - "password-reset.ts"
Cohesion: 0.10
Nodes (33): db, main(), derive(), hashPassword(), verifyPassword(), createSession(), invalidateAllSessions(), invalidateSession() (+25 more)

### Community 53 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 62 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @fontsource-variable/albert-sans@^5.3.0, @fontsource-variable/imbue@^5.3.0, leaflet@^1.9.4, maplibre-gl@^4.7.1, @maplibre/maplibre-gl-leaflet@^0.0.22, next@^15.5.28, pdf-lib@^1.17.1 (+11 more)

### Community 76 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:demo, db:deploy, db:migrate, db:seed, dev, lint (+5 more)

### Community 123 - "AppShell.tsx"
Cohesion: 0.16
Nodes (10): react, metadata, navUrl(), NEXT_STEP, NoOrg(), currentHref(), NavItem, ShellNav() (+2 more)

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `actions.ts`, `AgencyOverview.tsx`, `package.json`, `ShiftTracker.tsx`, `organizations/[id]/page.tsx`, `boerse/page.tsx`, `getI18n`, `auftrag/[id]/page.tsx`, `AppShell.tsx`, `organizations/[id]/page.tsx`, `dependencies`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `20261026102414_phase3_marketplace/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Why does `getI18n` connect `getI18n` to `next`, `AgencyOverview.tsx`, `organizations/[id]/page.tsx`, `boerse/page.tsx`, `auftrag/[id]/page.tsx`, `AppShell.tsx`, `organizations/[id]/page.tsx`, `dispatch.ts`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.08325624421831637 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `organizations/[id]/page.tsx` to `marketplace.ts`, `actions.ts`, `AgencyOverview.tsx`, `package.json`, `requirePermission`, `password-reset.ts`, `organizations/[id]/page.tsx`, `auftrag/[id]/page.tsx`, `dispatch.ts`, `dependencies`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `LiveMap.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13405797101449277 - nodes in this community are weakly interconnected._
- **Should `marketplace.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06951743908265648 - nodes in this community are weakly interconnected._