# Graph Report - taxi_route-hero  (2026-11-10)

## Corpus Check
- 142 files · ~79,906 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .css 5, (none) 3, .example 1)

## Summary
- 925 nodes · 3484 edges · 32 communities (25 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b682d6a5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 20261026102414_phase3_marketplace/migration.sql
- notFound
- LiveMap.tsx
- marketplace.ts
- actions.ts
- getI18n
- Landing.tsx
- invalid
- organizations/[id]/page.tsx
- requirePermission
- Product
- db.ts
- members.ts
- vercel.json
- errors.ts
- context.ts
- messages.ts
- Transferborsa
- audit
- layout.tsx
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
- `liveFleetDemo()` --calls--> `assignBooking()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/dispatch.ts
- `main()` --calls--> `hashPassword()`  [EXTRACTED]
  prisma/seed.ts → src/server/auth/password.ts
- `driver()` --calls--> `hashPassword()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/auth/password.ts
- `addMember()` --calls--> `hashPassword()`  [EXTRACTED]
  tests/helpers.ts → src/server/auth/password.ts
- `createAdmin()` --calls--> `hashPassword()`  [EXTRACTED]
  tests/helpers.ts → src/server/auth/password.ts

## Import Cycles
- 2-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/notifications.ts`

## Communities (32 total, 7 thin omitted)

### Community 0 - "20261026102414_phase3_marketplace/migration.sql"
Cohesion: 0.05
Nodes (63): "AuditEvent", AuditEvent_organizationId_createdAt_idx, "Invitation", Invitation_organizationId_idx, Invitation_tokenHash_key, "Membership", Membership_organizationId_idx, Membership_userId_organizationId_key (+55 more)

### Community 1 - "notFound"
Cohesion: 0.21
Nodes (19): requirePlatformAdmin(), notFound(), adminGetOrganization(), adminListOrganizations(), adminReviewCapability(), adminReviewDocument(), adminSetOrganizationPlan(), adminSetOrganizationStatus() (+11 more)

### Community 2 - "LiveMap.tsx"
Cohesion: 0.12
Nodes (21): leaflet@^1.9.4, leaflet, ago(), AUSTRIA, Basemap, duration(), esc(), headingOf() (+13 more)

### Community 3 - "marketplace.ts"
Cohesion: 0.06
Nodes (87): at(), driver(), liveFleetDemo(), main(), org(), trail(), vitest, bookingTransitionAction() (+79 more)

### Community 4 - "actions.ts"
Cohesion: 0.10
Nodes (64): acceptInvitationAction(), acceptQuoteAction(), addPartnerAction(), adminReviewCapabilityAction(), adminReviewDocumentAction(), adminSetOrgPlanAction(), adminSetOrgStatusAction(), advanceAudienceAction() (+56 more)

### Community 5 - "getI18n"
Cohesion: 0.05
Nodes (122): nextConfig, next, AdminOrgPage(), AdminPage(), PlanCell(), STATUSES, TYPES, RequestDetailPage() (+114 more)

### Community 7 - "Landing.tsx"
Cohesion: 0.07
Nodes (34): react, Home(), Labels, HeroClaim(), Labels, AUDIENCE, ChatScene(), Confirmation() (+26 more)

### Community 8 - "invalid"
Cohesion: 0.16
Nodes (15): POST(), invalid(), driverOverview(), endShift(), openShift(), pointSchema, pointsSchema, POSITION_RETENTION_DAYS (+7 more)

### Community 11 - "organizations/[id]/page.tsx"
Cohesion: 0.06
Nodes (48): GET(), EN, Locale, LOCALE_COOKIE, LOCALES, makeT(), pickLocale(), T (+40 more)

### Community 13 - "requirePermission"
Cohesion: 0.40
Nodes (9): requirePermission(), agencyOverview(), listInvitations(), getOwnOrganization(), getPublicOrganizationProfile(), requestCapabilityReview(), updateOrganizationProfile(), updateTransportProfile() (+1 more)

### Community 14 - "Product"
Cohesion: 0.20
Nodes (9): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Purpose (+1 more)

### Community 15 - "db.ts"
Cohesion: 0.18
Nodes (21): db, main(), derive(), hashPassword(), verifyPassword(), createSession(), invalidateAllSessions(), invalidateSession() (+13 more)

### Community 16 - "members.ts"
Cohesion: 0.29
Nodes (16): assignableRoles(), conflict(), forbidden(), acceptInvitation(), changeMemberRole(), consumeInvitation(), ensureNotLastOwner(), findOpenInvitation() (+8 more)

### Community 18 - "errors.ts"
Cohesion: 0.33
Nodes (6): GET(), GET(), AppError, AppErrorCode, getBookingDocumentForDownload(), getDocumentForDownload()

### Community 23 - "context.ts"
Cohesion: 0.16
Nodes (15): @prisma/client, db, globalForPrisma, Actor, OrgActor, transferInclude, TransferRow, listBookingDocuments() (+7 more)

### Community 25 - "messages.ts"
Cohesion: 0.17
Nodes (15): isPlaceId(), findMatchesForCapacity(), listCapacityWithMatches(), MatchInput, MatchResult, RequestForMatch, SIZE_ORDER, access() (+7 more)

### Community 26 - "Transferborsa"
Cohesion: 0.07
Nodes (27): Berechtigungsmodell, Datenmodelle, Gewählte Architektur, Implementierungsplan, Live-Flottenkarte und Fahrer, Offene Fragen (Annahmen getroffen, reversibel), Phase 1: Ist-Zustand (26.10.2026), Phase 4: Reisebüros (Szenario B) (+19 more)

### Community 27 - "audit"
Cohesion: 0.10
Nodes (20): zod, audit(), Tx, capacitySchema, listMarketCapacity(), listOwnCapacity(), place, publishCapacity() (+12 more)

### Community 28 - "layout.tsx"
Cohesion: 0.25
Nodes (6): @fontsource-variable/albert-sans@^5.3.0, @fontsource-variable/imbue@^5.3.0, @fontsource-variable/albert-sans, @fontsource-variable/imbue, generateMetadata(), RootLayout()

### Community 30 - "dispatch.ts"
Cohesion: 0.09
Nodes (29): GET(), BY_ID, getPlace(), haversineKm(), nearestPlace(), Place, Point, REGION_LABEL (+21 more)

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
Cohesion: 0.13
Nodes (15): dependencies, maplibre-gl@^4.7.1, @maplibre/maplibre-gl-leaflet@^0.0.22, next@^15.5.28, pdf-lib@^1.17.1, @prisma/client@^6.19.3, react@^19.1.1, react-dom@^19.1.1 (+7 more)

### Community 76 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:demo, db:deploy, db:migrate, db:seed, dev, lint (+5 more)

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `getI18n` to `marketplace.ts`, `actions.ts`, `package.json`, `Landing.tsx`, `organizations/[id]/page.tsx`, `layout.tsx`, `dependencies`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Should `20261026102414_phase3_marketplace/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.0528169014084507 - nodes in this community are weakly interconnected._
- **Why does `getI18n` connect `getI18n` to `organizations/[id]/page.tsx`, `layout.tsx`, `dispatch.ts`, `Landing.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `LiveMap.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12307692307692308 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `context.ts` to `notFound`, `marketplace.ts`, `actions.ts`, `getI18n`, `package.json`, `organizations/[id]/page.tsx`, `requirePermission`, `db.ts`, `members.ts`, `dispatch.ts`, `messages.ts`, `audit`, `dependencies`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Should `marketplace.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06098901098901099 - nodes in this community are weakly interconnected._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09883449883449884 - nodes in this community are weakly interconnected._