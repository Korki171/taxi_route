# Graph Report - taxi_route  (2026-11-10)

## Corpus Check
- 135 files · ~76,662 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .css 3, (none) 2, .example 1)

## Summary
- 881 nodes · 3414 edges · 38 communities (32 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2aa67604`
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
- invalid
- organizations/[id]/page.tsx
- server/i18n.ts
- boerse/page.tsx
- getI18n
- db.ts
- members.ts
- vercel.json
- parse
- requirePermission
- notifications.ts
- notFound
- context.ts
- messages.ts
- takeFixedPriceRequest
- permissions.ts
- Transferborsa
- @prisma/client
- ShiftTracker
- dispatch.ts
- test
- package.json
- compilerOptions
- dependencies
- scripts
- web.ts
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
9. `parse()` - 38 edges
10. `next` - 38 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `acceptQuote()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts
- `liveFleetDemo()` --calls--> `createTransferRequest()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts
- `main()` --calls--> `createTransferRequest()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts
- `main()` --calls--> `declineInvitation()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts
- `main()` --calls--> `submitQuote()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts

## Import Cycles
- 2-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/notifications.ts`

## Communities (38 total, 6 thin omitted)

### Community 0 - "20261026102414_phase3_marketplace/migration.sql"
Cohesion: 0.07
Nodes (53): "AuditEvent", AuditEvent_organizationId_createdAt_idx, "Invitation", Invitation_organizationId_idx, Invitation_tokenHash_key, "Membership", Membership_organizationId_idx, Membership_userId_organizationId_key (+45 more)

### Community 1 - "web.ts"
Cohesion: 0.13
Nodes (26): AdminOrgPage(), PlanCell(), STATUSES, TYPES, ALL_CAPS, OrganizationPage(), Org, OrgProfileFields() (+18 more)

### Community 2 - "LiveMap.tsx"
Cohesion: 0.13
Nodes (19): ago(), AUSTRIA, Basemap, duration(), esc(), headingOf(), legLabels(), legRoles() (+11 more)

### Community 3 - "marketplace.ts"
Cohesion: 0.10
Nodes (22): HandoffSplit, MAX_HANDOFF_SHARE_PERCENT, BoardFilter, boardFilterSchema, BOOKING_TO_REQUEST, checkInvitees(), listIncomingQuotes(), listInvitations() (+14 more)

### Community 4 - "actions.ts"
Cohesion: 0.09
Nodes (68): acceptInvitationAction(), acceptQuoteAction(), addPartnerAction(), adminReviewCapabilityAction(), adminReviewDocumentAction(), adminSetOrgPlanAction(), adminSetOrgStatusAction(), advanceAudienceAction() (+60 more)

### Community 5 - "flotte/page.tsx"
Cohesion: 0.18
Nodes (15): dynamic, GET(), RequestDetailPage(), stageIndex(), NewRequestPage(), FleetPage(), PlaceSelect(), ProviderPicker() (+7 more)

### Community 7 - "Landing.tsx"
Cohesion: 0.10
Nodes (23): @fontsource-variable/albert-sans@^5.3.0, @fontsource-variable/imbue@^5.3.0, @fontsource-variable/albert-sans, @fontsource-variable/imbue, generateMetadata(), RootLayout(), Home(), ClaimOrder() (+15 more)

### Community 8 - "invalid"
Cohesion: 0.13
Nodes (29): at(), liveFleetDemo(), main(), trail(), bookingTransitionAction(), invalid(), assignBooking(), advanceTrip() (+21 more)

### Community 11 - "organizations/[id]/page.tsx"
Cohesion: 0.07
Nodes (33): GET(), cache, df(), fmtDateTime(), fmtMinutes(), fmtTime(), tag(), EN (+25 more)

### Community 12 - "server/i18n.ts"
Cohesion: 0.10
Nodes (19): nextConfig, next, Datenschutz(), metadata, Impressum(), metadata, NotFound(), metadata (+11 more)

### Community 13 - "boerse/page.tsx"
Cohesion: 0.14
Nodes (39): BoersePage(), BookingsView(), CapacityMarketView(), CHIP_HIDDEN, FILTER_KEYS, GROUPS, InvitationsView(), MarketView() (+31 more)

### Community 14 - "getI18n"
Cohesion: 0.34
Nodes (13): InvitePage(), LoginPage(), DocumentsPage(), ForgotPasswordPage(), ResetPasswordPage(), RegisterPage(), AuthLayout(), Flash() (+5 more)

### Community 15 - "db.ts"
Cohesion: 0.14
Nodes (25): driver(), db, main(), db, globalForPrisma, derive(), hashPassword(), verifyPassword() (+17 more)

### Community 16 - "members.ts"
Cohesion: 0.12
Nodes (25): zod, GET(), assignableRoles(), AppError, AppErrorCode, conflict(), getDocumentForDownload(), acceptInvitation() (+17 more)

### Community 18 - "parse"
Cohesion: 0.18
Nodes (22): fromLocalInput(), requirePlatformAdmin(), adminGetOrganization(), adminListOrganizations(), adminReviewCapability(), adminReviewDocument(), adminSetOrganizationPlan(), adminSetOrganizationStatus() (+14 more)

### Community 19 - "requirePermission"
Cohesion: 0.20
Nodes (19): splitHandoff(), requirePermission(), listDispatchBookings(), listDrivers(), getTransferRequest(), ownVehicleId(), scopeSnapshot(), addPartner() (+11 more)

### Community 20 - "notifications.ts"
Cohesion: 0.20
Nodes (19): appUrl(), Email, sendAll(), sentEmails, localeOf(), mail(), notifyBooked(), notifyBookingReturned() (+11 more)

### Community 21 - "notFound"
Cohesion: 0.21
Nodes (20): forbidden(), notFound(), notificationFailed(), getBookingDocumentForDownload(), listBookingDocuments(), MAX_BOOKING_DOCUMENTS, participantBooking(), returnBooking() (+12 more)

### Community 22 - "context.ts"
Cohesion: 0.23
Nodes (14): org(), Actor, loadActor(), transferInclude, getOwnOrganization(), registerOrganization(), addDocument(), addMember() (+6 more)

### Community 23 - "messages.ts"
Cohesion: 0.18
Nodes (16): estimateMinutes(), categoryFits(), findMatchesForCapacity(), listCapacityWithMatches(), matchCapacity(), MatchInput, MatchResult, RequestForMatch (+8 more)

### Community 24 - "takeFixedPriceRequest"
Cohesion: 0.42
Nodes (9): vitest, createTransferRequest(), takeFixedPriceRequest(), booked(), setup(), inHours(), requestInput(), verifiedAgency() (+1 more)

### Community 25 - "permissions.ts"
Cohesion: 0.21
Nodes (10): ALL, can(), decide(), Decision, OrgAuthzInput, Permission, PERMISSION_CAPABILITY, PERMISSIONS (+2 more)

### Community 26 - "Transferborsa"
Cohesion: 0.07
Nodes (27): Berechtigungsmodell, Datenmodelle, Gewählte Architektur, Implementierungsplan, Live-Flottenkarte und Fahrer, Offene Fragen (Annahmen getroffen, reversibel), Phase 1: Ist-Zustand (26.10.2026), Phase 4: Reisebüros (Szenario B) (+19 more)

### Community 27 - "@prisma/client"
Cohesion: 0.24
Nodes (8): @prisma/client, Tx, requestCapabilityReview(), DEFAULT_CAPABILITIES, missingTransportDocuments(), orgProfileSchema, registrationSchema, transportProfileSchema

### Community 28 - "ShiftTracker"
Cohesion: 0.83
Nodes (4): ShiftTracker(), flush(), keepAwake(), onVisible()

### Community 30 - "dispatch.ts"
Cohesion: 0.14
Nodes (21): GET(), BY_ID, getPlace(), haversineKm(), isPlaceId(), nearestPlace(), Place, Point (+13 more)

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

### Community 123 - "web.ts"
Cohesion: 0.14
Nodes (20): react, server-only, AdminPage(), DriverPage(), metadata, navUrl(), NEXT_STEP, NoOrg() (+12 more)

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `server/i18n.ts` to `web.ts`, `actions.ts`, `flotte/page.tsx`, `package.json`, `Landing.tsx`, `organizations/[id]/page.tsx`, `boerse/page.tsx`, `getI18n`, `web.ts`, `dependencies`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `20261026102414_phase3_marketplace/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Why does `getI18n` connect `getI18n` to `web.ts`, `actions.ts`, `flotte/page.tsx`, `Landing.tsx`, `organizations/[id]/page.tsx`, `server/i18n.ts`, `boerse/page.tsx`, `web.ts`, `dispatch.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `web.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13306451612903225 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `@prisma/client` to `web.ts`, `marketplace.ts`, `actions.ts`, `package.json`, `invalid`, `organizations/[id]/page.tsx`, `boerse/page.tsx`, `getI18n`, `db.ts`, `members.ts`, `parse`, `requirePermission`, `messages.ts`, `context.ts`, `dispatch.ts`, `permissions.ts`, `dependencies`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Should `LiveMap.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13405797101449277 - nodes in this community are weakly interconnected._
- **Should `marketplace.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09538461538461539 - nodes in this community are weakly interconnected._