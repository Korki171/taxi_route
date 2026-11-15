# Graph Report - taxi_route  (2026-11-15)

## Corpus Check
- 168 files · ~90,764 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .css 5, (none) 2, .example 1)

## Summary
- 979 nodes · 3799 edges · 43 communities (39 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9f64e705`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- demo-boerse.ts
- Flash
- LiveMap.tsx
- marketplace.ts
- actions.ts
- auftrag/[id]/page.tsx
- weitergabe.yml
- Landing.tsx
- parse
- driver.ts
- errors.ts
- lib/i18n.ts
- members.ts
- db.ts
- Product
- messages.ts
- getI18n
- vercel.json
- notFound
- organization/page.tsx
- ShiftTracker.tsx
- actorCan
- server/push.ts
- next
- PushToggle.tsx
- requirePermission
- Transferborsa
- audit
- server/i18n.ts
- notifications.ts
- dispatch.ts
- Startseite (/)
- renderConfirmationPdf
- matching.ts
- TrackLive.tsx
- test
- dashboard/page.tsx
- package.json
- compilerOptions
- dependencies
- scripts
- CLAUDE.md
- BILDNACHWEISE.md

## God Nodes (most connected - your core abstractions)
1. `requirePermission()` - 95 edges
2. `getI18n` - 93 edges
3. `getActor()` - 70 edges
4. `notFound()` - 62 edges
5. `runAction()` - 53 edges
6. `invalid()` - 51 edges
7. `db` - 50 edges
8. `actorCan()` - 43 edges
9. `parse()` - 40 edges
10. `next` - 40 edges

## Surprising Connections (you probably didn't know these)
- `driver()` --calls--> `hashPassword()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/auth/password.ts
- `liveFleetDemo()` --calls--> `advanceTrip()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/driver.ts
- `liveFleetDemo()` --calls--> `recordPositions()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/driver.ts
- `liveFleetDemo()` --calls--> `createTransferRequest()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts
- `liveFleetDemo()` --calls--> `takeFixedPriceRequest()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts

## Import Cycles
- 2-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/notifications.ts`
- 3-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/services/booking-extras.ts -> src/server/notifications.ts`

## Communities (43 total, 4 thin omitted)

### Community 0 - "demo-boerse.ts"
Cohesion: 0.18
Nodes (18): at(), driver(), liveFleetDemo(), main(), org(), trail(), fromLocalInput(), loadActor() (+10 more)

### Community 1 - "Flash"
Cohesion: 0.24
Nodes (11): LoginPage(), ForgotPasswordPage(), ResetPasswordPage(), RegisterPage(), Org, OrgProfileFields(), Req(), Flash() (+3 more)

### Community 2 - "LiveMap.tsx"
Cohesion: 0.15
Nodes (19): ago(), AUSTRIA, Basemap, duration(), esc(), headingOf(), legLabels(), legRoles() (+11 more)

### Community 3 - "marketplace.ts"
Cohesion: 0.08
Nodes (30): POST(), HANDOFF_SHARE_OPTIONS, HandoffSplit, MAX_HANDOFF_SHARE_PERCENT, splitHandoff(), BoardFilter, boardFilterSchema, BOOKING_TO_REQUEST (+22 more)

### Community 4 - "actions.ts"
Cohesion: 0.08
Nodes (74): acceptInvitationAction(), acceptQuoteAction(), addPartnerAction(), adminReviewCapabilityAction(), adminReviewDocumentAction(), adminSetOrgPlanAction(), adminSetOrgStatusAction(), advanceAudienceAction() (+66 more)

### Community 5 - "auftrag/[id]/page.tsx"
Cohesion: 0.11
Nodes (33): RequestDetailPage(), stageIndex(), STAGES, DriverPage(), metadata, navUrl(), NEXT_STEP, DirectoryEntry (+25 more)

### Community 6 - "weitergabe.yml"
Cohesion: 0.11
Nodes (18): concurrency, cancel-in-progress, group, APP_URL, jobs, weitergabe, name, on (+10 more)

### Community 7 - "Landing.tsx"
Cohesion: 0.06
Nodes (53): @fontsource-variable/albert-sans, @fontsource-variable/imbue, react, Datenschutz(), metadata, Impressum(), metadata, NotFound() (+45 more)

### Community 8 - "parse"
Cohesion: 0.16
Nodes (26): @prisma/client, requirePlatformAdmin(), adminGetOrganization(), adminListOrganizations(), adminReviewCapability(), adminReviewDocument(), adminSetOrganizationPlan(), adminSetOrganizationStatus() (+18 more)

### Community 9 - "driver.ts"
Cohesion: 0.14
Nodes (15): zod@^3.25.76, zod, POST(), driverOverview(), openShift(), pointSchema, pointsSchema, POSITION_RETENTION_DAYS (+7 more)

### Community 10 - "errors.ts"
Cohesion: 0.14
Nodes (19): GET(), GET(), OrgActor, AppError, AppErrorCode, conflict(), getBookingDocumentForDownload(), listBookingDocuments() (+11 more)

### Community 11 - "lib/i18n.ts"
Cohesion: 0.16
Nodes (11): EN, LOCALE_COOKIE, LOCALES, makeT(), pickLocale(), T, translate(), Vars (+3 more)

### Community 12 - "members.ts"
Cohesion: 0.08
Nodes (33): ALL, assignableRoles(), can(), decide(), Decision, OrgAuthzInput, Permission, PERMISSION_CAPABILITY (+25 more)

### Community 13 - "db.ts"
Cohesion: 0.20
Nodes (21): vitest, db, globalForPrisma, agencyOverview(), transferInclude, TransferRow, createTransferRequest(), booked() (+13 more)

### Community 14 - "Product"
Cohesion: 0.20
Nodes (9): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Purpose (+1 more)

### Community 15 - "messages.ts"
Cohesion: 0.17
Nodes (13): isPlaceId(), Actor, forbidden(), access(), alertSchema, canWrite(), listThreads(), MAX_MESSAGE_LENGTH (+5 more)

### Community 16 - "getI18n"
Cohesion: 0.18
Nodes (28): BoersePage(), BookingsView(), CapacityMarketView(), CHIP_HIDDEN, FILTER_KEYS, GROUPS, InvitationsView(), MarketView() (+20 more)

### Community 18 - "notFound"
Cohesion: 0.25
Nodes (23): bookingTransitionAction(), invalid(), notFound(), notificationFailed(), returnBooking(), advanceTrip(), acceptQuote(), cancelBooking() (+15 more)

### Community 19 - "organization/page.tsx"
Cohesion: 0.17
Nodes (18): AdminOrgPage(), STATUSES, TYPES, NoOrg(), ALL_CAPS, CAPABILITY_LABEL, DOC_STATUS_LABEL, ORG_STATUS_LABEL (+10 more)

### Community 20 - "ShiftTracker.tsx"
Cohesion: 0.38
Nodes (6): Fix, ShiftTracker(), flush(), keepAwake(), onVisible(), TrackerText

### Community 21 - "actorCan"
Cohesion: 0.27
Nodes (18): AdminPage(), PlanCell(), NewRequestPage(), LiveFleetPage(), FleetPage(), DocumentsPage(), MembersPage(), ROLE_HELP (+10 more)

### Community 22 - "server/push.ts"
Cohesion: 0.24
Nodes (10): web-push@^4.0.0, web-push, appUrl(), BUSINESS_ROLES, configure(), OrgPush, PushMessage, sendPushes() (+2 more)

### Community 23 - "next"
Cohesion: 0.17
Nodes (8): nextConfig, next, InvitePage(), currentHref(), NavItem, ShellNav(), ORG_TYPE_LABEL, ROLE_LABEL

### Community 24 - "PushToggle.tsx"
Cohesion: 0.36
Nodes (6): keyBytes(), PushText, PushToggle(), enable(), save(), State

### Community 25 - "requirePermission"
Cohesion: 0.19
Nodes (19): dynamic, GET, POST, run(), requirePermission(), getTransferRequest(), addPartner(), advance() (+11 more)

### Community 26 - "Transferborsa"
Cohesion: 0.06
Nodes (33): Berechtigungsmodell, Datenmodelle, Gewählte Architektur, Implementierungsplan, Live-Flottenkarte und Fahrer, Offene Fragen (Annahmen getroffen, reversibel), Phase 1: Ist-Zustand (26.10.2026), Phase 4: Reisebüros (Szenario B) (+25 more)

### Community 27 - "audit"
Cohesion: 0.15
Nodes (24): db, main(), derive(), hashPassword(), verifyPassword(), createSession(), invalidateAllSessions(), invalidateSession() (+16 more)

### Community 28 - "server/i18n.ts"
Cohesion: 0.18
Nodes (15): cache, df(), fmtDate(), fmtDateTime(), fmtMinutes(), fmtTime(), tag(), Locale (+7 more)

### Community 29 - "notifications.ts"
Cohesion: 0.24
Nodes (17): deliver(), localeOf(), note(), notifyBooked(), notifyBookingReturned(), notifyBookingStatus(), notifyInvited(), notifyNewMessage() (+9 more)

### Community 30 - "dispatch.ts"
Cohesion: 0.13
Nodes (23): GET(), GET(), BY_ID, getPlace(), haversineKm(), nearestPlace(), Place, PLACES (+15 more)

### Community 32 - "renderConfirmationPdf"
Cohesion: 0.27
Nodes (7): GET(), renderConfirmationPdf(), Writer, BookingConfirmation, bookingReference(), getBookingConfirmation(), orgSelect

### Community 33 - "matching.ts"
Cohesion: 0.26
Nodes (10): estimateMinutes(), categoryFits(), findMatchesForCapacity(), listCapacityWithMatches(), matchCapacity(), MatchInput, MatchResult, RequestForMatch (+2 more)

### Community 34 - "TrackLive.tsx"
Cohesion: 0.22
Nodes (8): leaflet@^1.9.4, @maplibre/maplibre-gl-leaflet@^0.0.22, leaflet, @maplibre/maplibre-gl-leaflet, stateKey(), TrackLive(), TrackText, TrackView

### Community 35 - "test"
Cohesion: 0.08
Nodes (25): DATABASE_URL, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, jobs, test, name, on (+17 more)

### Community 36 - "dashboard/page.tsx"
Cohesion: 0.33
Nodes (9): Dashboard(), FEATURES, Figure, overallVerification(), authzInput(), listBookings(), listIncomingQuotes(), listInvitations() (+1 more)

### Community 38 - "package.json"
Cohesion: 0.10
Nodes (26): description, devDependencies, dotenv-cli@^11.0.0, prisma@^6.19.3, tsx@^4.23.15, @types/leaflet@^1.9.22, @types/node@^22.20.5, @types/react@^19.3.0 (+18 more)

### Community 53 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 62 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, @fontsource-variable/albert-sans@^5.3.0, @fontsource-variable/imbue@^5.3.0, maplibre-gl@^4.7.1, next@^15.5.28, pdf-lib@^1.17.1, @prisma/client@^6.19.3, react@^19.1.1 (+6 more)

### Community 76 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:demo, db:deploy, db:migrate, db:seed, dev, lint (+5 more)

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `Flash`, `actions.ts`, `auftrag/[id]/page.tsx`, `package.json`, `dashboard/page.tsx`, `Landing.tsx`, `lib/i18n.ts`, `getI18n`, `organization/page.tsx`, `ShiftTracker.tsx`, `actorCan`, `requirePermission`, `server/i18n.ts`, `dependencies`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Should `marketplace.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08403361344537816 - nodes in this community are weakly interconnected._
- **Why does `getI18n` connect `getI18n` to `renderConfirmationPdf`, `Flash`, `marketplace.ts`, `dashboard/page.tsx`, `auftrag/[id]/page.tsx`, `Landing.tsx`, `lib/i18n.ts`, `organization/page.tsx`, `actorCan`, `next`, `server/i18n.ts`, `dispatch.ts`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08179162609542356 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Landing.tsx` to `LiveMap.tsx`, `TrackLive.tsx`, `auftrag/[id]/page.tsx`, `package.json`, `ShiftTracker.tsx`, `next`, `PushToggle.tsx`, `server/i18n.ts`, `dependencies`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `auftrag/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10796221322537113 - nodes in this community are weakly interconnected._
- **Should `weitergabe.yml` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._