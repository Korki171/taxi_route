# Graph Report - taxi_route  (2026-11-10)

## Corpus Check
- 132 files · ~74,834 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .css 3, (none) 2, .example 1)

## Summary
- 869 nodes · 3321 edges · 30 communities (24 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d59aec2e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 20261026102414_phase3_marketplace/migration.sql
- web.ts
- LiveMap.tsx
- marketplace.ts
- actions.ts
- flotte/page.tsx
- Landing.tsx
- requirePermission
- organizations/[id]/page.tsx
- server/i18n.ts
- boerse/page.tsx
- getI18n
- auftrag/[id]/page.tsx
- LegalPage
- vercel.json
- dashboard/page.tsx
- layout.tsx
- Transferborsa
- dispatch.ts
- test
- package.json
- compilerOptions
- dependencies
- scripts
- fahrer/page.tsx
- CLAUDE.md
- BILDNACHWEISE.md

## God Nodes (most connected - your core abstractions)
1. `requirePermission()` - 84 edges
2. `getI18n` - 84 edges
3. `getActor()` - 61 edges
4. `notFound()` - 55 edges
5. `runAction()` - 49 edges
6. `invalid()` - 46 edges
7. `db` - 41 edges
8. `next` - 38 edges
9. `actorCan()` - 37 edges
10. `Flash()` - 35 edges

## Surprising Connections (you probably didn't know these)
- `liveFleetDemo()` --calls--> `createTransferRequest()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts
- `liveFleetDemo()` --calls--> `takeFixedPriceRequest()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts
- `main()` --calls--> `acceptQuote()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts
- `main()` --calls--> `createTransferRequest()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts
- `main()` --calls--> `declineInvitation()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts

## Import Cycles
- 2-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/notifications.ts`

## Communities (30 total, 6 thin omitted)

### Community 0 - "20261026102414_phase3_marketplace/migration.sql"
Cohesion: 0.07
Nodes (53): "AuditEvent", AuditEvent_organizationId_createdAt_idx, "Invitation", Invitation_organizationId_idx, Invitation_tokenHash_key, "Membership", Membership_organizationId_idx, Membership_userId_organizationId_key (+45 more)

### Community 1 - "web.ts"
Cohesion: 0.17
Nodes (23): AdminOrgPage(), AdminPage(), PlanCell(), STATUSES, TYPES, NoOrg(), ALL_CAPS, OrganizationPage() (+15 more)

### Community 2 - "LiveMap.tsx"
Cohesion: 0.13
Nodes (19): ago(), AUSTRIA, Basemap, duration(), esc(), headingOf(), legLabels(), legRoles() (+11 more)

### Community 3 - "marketplace.ts"
Cohesion: 0.07
Nodes (66): HANDOFF_SHARE_OPTIONS, HandoffSplit, MAX_HANDOFF_SHARE_PERCENT, splitHandoff(), conflict(), notificationFailed(), acceptQuote(), BoardFilter (+58 more)

### Community 4 - "actions.ts"
Cohesion: 0.07
Nodes (82): acceptInvitationAction(), acceptQuoteAction(), addPartnerAction(), adminReviewCapabilityAction(), adminReviewDocumentAction(), adminSetOrgPlanAction(), adminSetOrgStatusAction(), advanceAudienceAction() (+74 more)

### Community 5 - "flotte/page.tsx"
Cohesion: 0.31
Nodes (10): NewRequestPage(), FleetPage(), DirectoryEntry, PlaceSelect(), ProviderPicker(), VehicleSelect(), CAPACITY_STATUS_LABEL, REGION_LABEL (+2 more)

### Community 7 - "Landing.tsx"
Cohesion: 0.15
Nodes (16): Home(), ClaimOrder(), Labels, CardSpec, ChatScene(), Confirmation(), FAQ, Flow (+8 more)

### Community 8 - "requirePermission"
Cohesion: 0.05
Nodes (118): at(), driver(), liveFleetDemo(), main(), org(), trail(), db, main() (+110 more)

### Community 11 - "organizations/[id]/page.tsx"
Cohesion: 0.06
Nodes (47): GET(), EN, Locale, LOCALE_COOKIE, LOCALES, makeT(), T, translate() (+39 more)

### Community 12 - "server/i18n.ts"
Cohesion: 0.16
Nodes (13): nextConfig, next, react, server-only, generateMetadata(), PreisePage(), Pricing(), LangSwitch() (+5 more)

### Community 13 - "boerse/page.tsx"
Cohesion: 0.16
Nodes (33): dynamic, GET(), RequestDetailPage(), BoersePage(), BookingsView(), CapacityMarketView(), CHIP_HIDDEN, FILTER_KEYS (+25 more)

### Community 14 - "getI18n"
Cohesion: 0.26
Nodes (16): InvitePage(), LoginPage(), DocumentsPage(), ForgotPasswordPage(), ResetPasswordPage(), RegisterPage(), AuthLayout(), Org (+8 more)

### Community 15 - "auftrag/[id]/page.tsx"
Cohesion: 0.14
Nodes (19): stageIndex(), STAGES, cache, df(), fmtDateTime(), fmtMinutes(), fmtTime(), tag() (+11 more)

### Community 16 - "LegalPage"
Cohesion: 0.18
Nodes (9): Datenschutz(), metadata, Impressum(), metadata, NotFound(), metadata, Nutzungsbedingungen(), BackLink() (+1 more)

### Community 18 - "dashboard/page.tsx"
Cohesion: 0.26
Nodes (12): Dashboard(), FEATURES, Figure, MembersPage(), ROLE_HELP, overallVerification(), actorCan(), authzInput() (+4 more)

### Community 19 - "layout.tsx"
Cohesion: 0.25
Nodes (6): @fontsource-variable/albert-sans@^5.3.0, @fontsource-variable/imbue@^5.3.0, @fontsource-variable/albert-sans, @fontsource-variable/imbue, generateMetadata(), RootLayout()

### Community 26 - "Transferborsa"
Cohesion: 0.07
Nodes (27): Berechtigungsmodell, Datenmodelle, Gewählte Architektur, Implementierungsplan, Live-Flottenkarte und Fahrer, Offene Fragen (Annahmen getroffen, reversibel), Phase 1: Ist-Zustand (26.10.2026), Phase 4: Reisebüros (Szenario B) (+19 more)

### Community 30 - "dispatch.ts"
Cohesion: 0.10
Nodes (28): GET(), BY_ID, estimateMinutes(), getPlace(), haversineKm(), isPlaceId(), nearestPlace(), Place (+20 more)

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

### Community 123 - "fahrer/page.tsx"
Cohesion: 0.22
Nodes (11): DriverPage(), metadata, navUrl(), NEXT_STEP, Fix, ShiftTracker(), flush(), keepAwake() (+3 more)

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `server/i18n.ts` to `web.ts`, `actions.ts`, `flotte/page.tsx`, `package.json`, `Landing.tsx`, `organizations/[id]/page.tsx`, `boerse/page.tsx`, `getI18n`, `auftrag/[id]/page.tsx`, `LegalPage`, `dashboard/page.tsx`, `layout.tsx`, `fahrer/page.tsx`, `dependencies`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `20261026102414_phase3_marketplace/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Why does `getI18n` connect `getI18n` to `web.ts`, `flotte/page.tsx`, `Landing.tsx`, `organizations/[id]/page.tsx`, `server/i18n.ts`, `boerse/page.tsx`, `auftrag/[id]/page.tsx`, `LegalPage`, `dashboard/page.tsx`, `layout.tsx`, `fahrer/page.tsx`, `dispatch.ts`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `LiveMap.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13405797101449277 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `requirePermission` to `web.ts`, `marketplace.ts`, `actions.ts`, `flotte/page.tsx`, `package.json`, `organizations/[id]/page.tsx`, `getI18n`, `auftrag/[id]/page.tsx`, `dispatch.ts`, `dependencies`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `marketplace.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07205452775073028 - nodes in this community are weakly interconnected._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06786114221724523 - nodes in this community are weakly interconnected._