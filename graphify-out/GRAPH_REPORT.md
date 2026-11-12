# Graph Report - taxi_route-hero  (2026-11-12)

## Corpus Check
- 144 files · ~80,681 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 6, (none) 3, .example 1)

## Summary
- 934 nodes · 3511 edges · 31 communities (24 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `099b6192`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 20261026102414_phase3_marketplace/migration.sql
- admin.ts
- LiveMap.tsx
- marketplace.ts
- actions.ts
- getI18n
- Landing.tsx
- driver.ts
- organizations/[id]/page.tsx
- documents.ts
- requirePermission
- Product
- validation.ts
- ShiftTracker
- vercel.json
- layout.tsx
- errors.ts
- Transferborsa
- db.ts
- permissions.ts
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
- `setup()` --calls--> `createVehicle()`  [EXTRACTED]
  tests/fleet-tracking.test.ts → src/server/services/fleet.ts
- `liveFleetDemo()` --calls--> `createTransferRequest()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts
- `main()` --calls--> `createTransferRequest()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts
- `liveFleetDemo()` --calls--> `takeFixedPriceRequest()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts

## Import Cycles
- 2-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/notifications.ts`

## Communities (31 total, 7 thin omitted)

### Community 0 - "20261026102414_phase3_marketplace/migration.sql"
Cohesion: 0.05
Nodes (63): "AuditEvent", AuditEvent_organizationId_createdAt_idx, "Invitation", Invitation_organizationId_idx, Invitation_tokenHash_key, "Membership", Membership_organizationId_idx, Membership_userId_organizationId_key (+55 more)

### Community 1 - "admin.ts"
Cohesion: 0.32
Nodes (7): zod, requirePlatformAdmin(), adminGetOrganization(), adminListOrganizations(), planSchema, reviewSchema, listSelect

### Community 2 - "LiveMap.tsx"
Cohesion: 0.13
Nodes (19): ago(), AUSTRIA, Basemap, duration(), esc(), headingOf(), legLabels(), legRoles() (+11 more)

### Community 3 - "marketplace.ts"
Cohesion: 0.06
Nodes (47): GET(), HANDOFF_SHARE_OPTIONS, HandoffSplit, MAX_HANDOFF_SHARE_PERCENT, BY_ID, estimateMinutes(), getPlace(), haversineKm() (+39 more)

### Community 4 - "actions.ts"
Cohesion: 0.05
Nodes (139): at(), liveFleetDemo(), main(), trail(), acceptInvitationAction(), acceptQuoteAction(), addPartnerAction(), adminReviewCapabilityAction() (+131 more)

### Community 5 - "getI18n"
Cohesion: 0.05
Nodes (127): nextConfig, next, AdminOrgPage(), AdminPage(), PlanCell(), STATUSES, TYPES, dynamic (+119 more)

### Community 7 - "Landing.tsx"
Cohesion: 0.07
Nodes (36): react@^19.1.1, react, Home(), Labels, HeroClaim(), Labels, AUDIENCE, Confirmation() (+28 more)

### Community 8 - "driver.ts"
Cohesion: 0.18
Nodes (10): driverOverview(), openShift(), pointSchema, pointsSchema, POSITION_RETENTION_DAYS, POSITION_STALE_SECONDS, purgeOldPositions(), startSchema (+2 more)

### Community 11 - "organizations/[id]/page.tsx"
Cohesion: 0.06
Nodes (48): GET(), EN, Locale, LOCALE_COOKIE, LOCALES, makeT(), pickLocale(), T (+40 more)

### Community 12 - "documents.ts"
Cohesion: 0.28
Nodes (7): GET(), ALLOWED, getDocumentForDownload(), listOwnDocuments(), MAX_DOCUMENT_BYTES, metaSchema, UploadFile

### Community 13 - "requirePermission"
Cohesion: 0.33
Nodes (7): Actor, OrgActor, access(), alertSchema, canWrite(), listThreads(), MAX_MESSAGE_LENGTH

### Community 14 - "Product"
Cohesion: 0.20
Nodes (9): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Purpose (+1 more)

### Community 15 - "validation.ts"
Cohesion: 0.20
Nodes (7): countrySchema, memberRoleSchema, orgProfileSchema, passwordSchema, registrationSchema, transportProfileSchema, userInputSchema

### Community 16 - "ShiftTracker"
Cohesion: 0.83
Nodes (4): ShiftTracker(), flush(), keepAwake(), onVisible()

### Community 20 - "layout.tsx"
Cohesion: 0.25
Nodes (6): @fontsource-variable/albert-sans@^5.3.0, @fontsource-variable/imbue@^5.3.0, @fontsource-variable/albert-sans, @fontsource-variable/imbue, generateMetadata(), RootLayout()

### Community 23 - "errors.ts"
Cohesion: 0.26
Nodes (10): GET(), AppError, AppErrorCode, forbidden(), getBookingDocumentForDownload(), listBookingDocuments(), MAX_BOOKING_DOCUMENTS, participantBooking() (+2 more)

### Community 26 - "Transferborsa"
Cohesion: 0.07
Nodes (27): Berechtigungsmodell, Datenmodelle, Gewählte Architektur, Implementierungsplan, Live-Flottenkarte und Fahrer, Offene Fragen (Annahmen getroffen, reversibel), Phase 1: Ist-Zustand (26.10.2026), Phase 4: Reisebüros (Szenario B) (+19 more)

### Community 27 - "db.ts"
Cohesion: 0.07
Nodes (68): driver(), org(), db, main(), @prisma/client, vitest, registerViaInvitationAction(), db (+60 more)

### Community 30 - "permissions.ts"
Cohesion: 0.20
Nodes (11): ALL, assignableRoles(), can(), decide(), Decision, OrgAuthzInput, Permission, PERMISSION_CAPABILITY (+3 more)

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
Nodes (16): dependencies, leaflet@^1.9.4, maplibre-gl@^4.7.1, @maplibre/maplibre-gl-leaflet@^0.0.22, next@^15.5.28, pdf-lib@^1.17.1, @prisma/client@^6.19.3, react-dom@^19.1.1 (+8 more)

### Community 76 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:demo, db:deploy, db:migrate, db:seed, dev, lint (+5 more)

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `getI18n` to `actions.ts`, `package.json`, `Landing.tsx`, `organizations/[id]/page.tsx`, `layout.tsx`, `dependencies`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Should `20261026102414_phase3_marketplace/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.0528169014084507 - nodes in this community are weakly interconnected._
- **Why does `getI18n` connect `getI18n` to `marketplace.ts`, `organizations/[id]/page.tsx`, `layout.tsx`, `Landing.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `LiveMap.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13405797101449277 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Landing.tsx` to `LiveMap.tsx`, `getI18n`, `package.json`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `marketplace.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.053065134099616856 - nodes in this community are weakly interconnected._