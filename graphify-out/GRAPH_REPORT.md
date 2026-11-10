# Graph Report - taxi_route  (2026-11-10)

## Corpus Check
- 128 files · ~73,319 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .css 3, (none) 2, .example 1)

## Summary
- 856 nodes · 3226 edges · 30 communities (23 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2af995be`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 20261026102414_phase3_marketplace/migration.sql
- dispatch.ts
- LiveMap.tsx
- marketplace.ts
- actions.ts
- fleet.ts
- Landing.tsx
- requirePermission
- organizations/[id]/page.tsx
- members.ts
- getI18n
- errors.ts
- permissions.ts
- leaflet
- vercel.json
- Transferborsa
- context.ts
- places.ts
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
2. `requirePermission()` - 79 edges
3. `getActor()` - 58 edges
4. `notFound()` - 51 edges
5. `runAction()` - 48 edges
6. `invalid()` - 42 edges
7. `db` - 39 edges
8. `next` - 38 edges
9. `Flash()` - 35 edges
10. `actorCan()` - 35 edges

## Surprising Connections (you probably didn't know these)
- `liveFleetDemo()` --calls--> `recordPositions()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/driver.ts
- `liveFleetDemo()` --calls--> `assignBooking()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/dispatch.ts
- `main()` --calls--> `publishCapacity()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/fleet.ts
- `main()` --calls--> `setCapacityStatus()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/fleet.ts
- `main()` --calls--> `hashPassword()`  [EXTRACTED]
  prisma/seed.ts → src/server/auth/password.ts

## Import Cycles
- 2-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/notifications.ts`

## Communities (30 total, 7 thin omitted)

### Community 0 - "20261026102414_phase3_marketplace/migration.sql"
Cohesion: 0.07
Nodes (53): "AuditEvent", AuditEvent_organizationId_createdAt_idx, "Invitation", Invitation_organizationId_idx, Invitation_tokenHash_key, "Membership", Membership_organizationId_idx, Membership_userId_organizationId_key (+45 more)

### Community 1 - "dispatch.ts"
Cohesion: 0.12
Nodes (14): zod, assignSchema, DRIVING_ROLES, listDispatchBookings(), listDrivers(), LivePoint, countrySchema, emailSchema (+6 more)

### Community 2 - "LiveMap.tsx"
Cohesion: 0.13
Nodes (19): ago(), AUSTRIA, Basemap, duration(), esc(), headingOf(), legLabels(), legRoles() (+11 more)

### Community 3 - "marketplace.ts"
Cohesion: 0.06
Nodes (88): at(), driver(), liveFleetDemo(), main(), org(), trail(), db, main() (+80 more)

### Community 4 - "actions.ts"
Cohesion: 0.10
Nodes (65): acceptInvitationAction(), acceptQuoteAction(), addPartnerAction(), adminReviewCapabilityAction(), adminReviewDocumentAction(), adminSetOrgPlanAction(), adminSetOrgStatusAction(), advanceAudienceAction() (+57 more)

### Community 5 - "fleet.ts"
Cohesion: 0.25
Nodes (7): capacitySchema, listMarketCapacity(), listOwnCapacity(), place, setVehicleActive(), vehicleCategory, vehicleSchema

### Community 7 - "Landing.tsx"
Cohesion: 0.07
Nodes (34): react, Datenschutz(), metadata, Impressum(), metadata, NotFound(), metadata, Nutzungsbedingungen() (+26 more)

### Community 8 - "requirePermission"
Cohesion: 0.23
Nodes (27): requirePermission(), requirePlatformAdmin(), invalid(), notFound(), adminReviewCapability(), adminReviewDocument(), adminSetOrganizationPlan(), adminSetOrganizationStatus() (+19 more)

### Community 11 - "organizations/[id]/page.tsx"
Cohesion: 0.06
Nodes (46): GET(), EN, Locale, LOCALE_COOKIE, LOCALES, makeT(), pickLocale(), T (+38 more)

### Community 12 - "members.ts"
Cohesion: 0.29
Nodes (16): assignableRoles(), conflict(), forbidden(), acceptInvitation(), changeMemberRole(), consumeInvitation(), ensureNotLastOwner(), findOpenInvitation() (+8 more)

### Community 13 - "getI18n"
Cohesion: 0.05
Nodes (121): nextConfig, next, AdminOrgPage(), AdminPage(), PlanCell(), STATUSES, TYPES, RequestDetailPage() (+113 more)

### Community 14 - "errors.ts"
Cohesion: 0.21
Nodes (10): GET(), AppError, AppErrorCode, ALLOWED, getDocumentForDownload(), listOwnDocuments(), listSelect, MAX_DOCUMENT_BYTES (+2 more)

### Community 15 - "permissions.ts"
Cohesion: 0.21
Nodes (10): ALL, can(), decide(), Decision, OrgAuthzInput, Permission, PERMISSION_CAPABILITY, PERMISSIONS (+2 more)

### Community 26 - "Transferborsa"
Cohesion: 0.07
Nodes (27): Berechtigungsmodell, Datenmodelle, Gewählte Architektur, Implementierungsplan, Live-Flottenkarte und Fahrer, Offene Fragen (Annahmen getroffen, reversibel), Phase 1: Ist-Zustand (26.10.2026), Phase 4: Reisebüros (Szenario B) (+19 more)

### Community 29 - "context.ts"
Cohesion: 0.20
Nodes (10): @prisma/client, db, globalForPrisma, Actor, agencyOverview(), transferInclude, TransferRow, Tx (+2 more)

### Community 30 - "places.ts"
Cohesion: 0.16
Nodes (15): GET(), BY_ID, getPlace(), haversineKm(), isPlaceId(), nearestPlace(), Place, PLACES (+7 more)

### Community 35 - "test"
Cohesion: 0.08
Nodes (25): DATABASE_URL, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, jobs, test, name, on (+17 more)

### Community 38 - "package.json"
Cohesion: 0.11
Nodes (24): description, devDependencies, dotenv-cli@^11.0.0, prisma@^6.19.3, tsx@^4.23.15, @types/leaflet@^1.9.22, @types/node@^22.20.5, @types/react@^19.3.0 (+16 more)

### Community 43 - "password-reset.ts"
Cohesion: 0.20
Nodes (17): derive(), verifyPassword(), createSession(), invalidateAllSessions(), invalidateSession(), SESSION_COOKIE, SESSION_TTL_MS, validateSessionToken() (+9 more)

### Community 53 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 62 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @fontsource-variable/albert-sans@^5.3.0, @fontsource-variable/imbue@^5.3.0, maplibre-gl@^4.7.1, @maplibre/maplibre-gl-leaflet@^0.0.22, next@^15.5.28, pdf-lib@^1.17.1, @prisma/client@^6.19.3 (+11 more)

### Community 76 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:demo, db:deploy, db:migrate, db:seed, dev, lint (+5 more)

### Community 123 - "driver.ts"
Cohesion: 0.15
Nodes (14): POST(), OrgActor, driverOverview(), openShift(), pointSchema, pointsSchema, POSITION_RETENTION_DAYS, POSITION_STALE_SECONDS (+6 more)

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `getI18n` to `marketplace.ts`, `actions.ts`, `package.json`, `Landing.tsx`, `organizations/[id]/page.tsx`, `dependencies`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `20261026102414_phase3_marketplace/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Why does `getI18n` connect `getI18n` to `organizations/[id]/page.tsx`, `places.ts`, `Landing.tsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `dispatch.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `context.ts` to `dispatch.ts`, `marketplace.ts`, `actions.ts`, `package.json`, `requirePermission`, `organizations/[id]/page.tsx`, `members.ts`, `getI18n`, `permissions.ts`, `dependencies`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `LiveMap.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13405797101449277 - nodes in this community are weakly interconnected._
- **Should `marketplace.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05606523955147808 - nodes in this community are weakly interconnected._