# Graph Report - taxi_route-hero  (2026-11-16)

## Corpus Check
- 205 files · ~108,793 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 5, (none) 4, .example 1)

## Summary
- 1265 nodes · 4849 edges · 56 communities (39 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f7074723`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 20261026102414_phase3_marketplace/migration.sql
- mobile/package.json
- "Organization"
- marketplace.ts
- actions.ts
- getI18n
- admin.ts
- Landing.tsx
- messages.ts
- driver.ts
- package.json
- 20261115230000_tenders/migration.sql
- 20261027161101_live_fleet_tracking/migration.sql
- db.ts
- Product
- "Rating"
- escalate/route.ts
- vercel.json
- notFound
- organizations/[id]/page.tsx
- 20261026110558_pilot_auth_ratelimit/migration.sql
- tenders.ts
- server/push.ts
- next.config.ts
- native.ts
- partners.ts
- Transferborsa
- members.ts
- lib/i18n.ts
- notifications.ts
- dispatch.ts
- Startseite (/)
- renderConfirmationPdf
- "PushSubscription"
- "QuoteInvitation"
- test
- "PartnerLink"
- "OrgBlock"
- package.json
- "BookingDocument"
- "Message"
- "JobAlert"
- "LoginChallenge"
- typescript@^5.9.3
- compilerOptions
- dependencies
- scripts
- CLAUDE.md
- BILDNACHWEISE.md

## God Nodes (most connected - your core abstractions)
1. `requirePermission()` - 116 edges
2. `getI18n` - 114 edges
3. `getActor()` - 86 edges
4. `notFound()` - 70 edges
5. `runAction()` - 67 edges
6. `invalid()` - 60 edges
7. `db` - 56 edges
8. `actorCan()` - 55 edges
9. `next` - 47 edges
10. `Flash()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `Transferborsa Fahrer-App (iOS und Android)` --references--> `NativeApp()`  [INFERRED]
  mobile/README.md → src/components/NativeApp.tsx
- `Transferborsa Fahrer-App (iOS und Android)` --references--> `PushToggle()`  [INFERRED]
  mobile/README.md → src/components/PushToggle.tsx
- `Transferborsa Fahrer-App (iOS und Android)` --references--> `ShiftTracker()`  [INFERRED]
  mobile/README.md → src/components/ShiftTracker.tsx
- `at()` --calls--> `fromLocalInput()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/lib/format.ts
- `org()` --calls--> `registerOrganization()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/registration.ts

## Import Cycles
- 2-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/notifications.ts`
- 3-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/services/booking-extras.ts -> src/server/notifications.ts`

## Communities (56 total, 17 thin omitted)

### Community 0 - "20261026102414_phase3_marketplace/migration.sql"
Cohesion: 0.15
Nodes (22): "Booking", Booking_providerOrgId_idx, Booking_quoteId_key, Booking_requesterOrgId_idx, Booking_requestId_key, "CapacityOffer", CapacityOffer_organizationId_idx, CapacityOffer_status_availableFrom_idx (+14 more)

### Community 1 - "mobile/package.json"
Cohesion: 0.08
Nodes (30): appUrl, config, dependencies, @capacitor/android@^8.6.2, @capacitor-community/background-geolocation@^1.3.1, @capacitor/core@^8.6.2, @capacitor-firebase/messaging@^8.6.0, @capacitor/ios@^8.6.2 (+22 more)

### Community 2 - ""Organization""
Cohesion: 0.21
Nodes (18): "AuditEvent", AuditEvent_organizationId_createdAt_idx, "Invitation", Invitation_organizationId_idx, Invitation_tokenHash_key, "Membership", Membership_organizationId_idx, Membership_userId_organizationId_key (+10 more)

### Community 3 - "marketplace.ts"
Cohesion: 0.07
Nodes (33): HANDOFF_SHARE_OPTIONS, HandoffSplit, MAX_HANDOFF_SHARE_PERCENT, estimateMinutes(), BoardFilter, boardFilterSchema, BOOKING_TO_REQUEST, BookingFrom (+25 more)

### Community 4 - "actions.ts"
Cohesion: 0.05
Nodes (112): acceptInvitationAction(), acceptQuoteAction(), addJobAlertAction(), addLocationAction(), addPartnerAction(), adminReviewCapabilityAction(), adminReviewDocumentAction(), adminSetOrgPlanAction() (+104 more)

### Community 5 - "getI18n"
Cohesion: 0.06
Nodes (126): next, server-only, dynamic, generateMetadata(), Props, SharedRequestPage(), RequestDetailPage(), stageIndex() (+118 more)

### Community 6 - "admin.ts"
Cohesion: 0.21
Nodes (10): @prisma/client, cache, df(), fromLocalInput(), tag(), planSchema, reviewSchema, DOCUMENT_LABELS (+2 more)

### Community 7 - "Landing.tsx"
Cohesion: 0.05
Nodes (53): @fontsource-variable/albert-sans@^5.3.0, @fontsource-variable/imbue@^5.3.0, @fontsource-variable/albert-sans, @fontsource-variable/imbue, react, Datenschutz(), metadata, Impressum() (+45 more)

### Community 8 - "messages.ts"
Cohesion: 0.06
Nodes (35): isPlaceId(), Actor, agencyOverview(), transferInclude, TransferRow, Tx, ALLOWED, listOwnDocuments() (+27 more)

### Community 9 - "driver.ts"
Cohesion: 0.13
Nodes (22): at(), driver(), liveFleetDemo(), main(), org(), trail(), POST(), loadActor() (+14 more)

### Community 10 - "package.json"
Cohesion: 0.18
Nodes (10): description, tsx@^4.23.15, @types/web-push@^3.6.4, name, prisma, seed, private, version (+2 more)

### Community 11 - "20261115230000_tenders/migration.sql"
Cohesion: 0.42
Nodes (8): "Tender", Tender_awardedBidId_key, Tender_number_key, Tender_requesterOrgId_idx, Tender_status_bidDeadline_idx, "TenderBid", TenderBid_providerOrgId_idx, TenderBid_tenderId_providerOrgId_key

### Community 12 - "20261027161101_live_fleet_tracking/migration.sql"
Cohesion: 0.43
Nodes (7): Booking_driverId_idx, "DriverShift", DriverShift_organizationId_endedAt_idx, DriverShift_userId_endedAt_idx, "PositionPing", PositionPing_recordedAt_idx, PositionPing_shiftId_recordedAt_idx

### Community 13 - "db.ts"
Cohesion: 0.21
Nodes (24): vitest, db, globalForPrisma, createTransferRequest(), searchBoard(), takeFixedPriceRequest(), booked(), setup() (+16 more)

### Community 14 - "Product"
Cohesion: 0.20
Nodes (9): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Purpose (+1 more)

### Community 15 - ""Rating""
Cohesion: 0.38
Nodes (5): "Rating", Rating_bookingId_fromOrgId_key, Rating_toOrgId_idx, "OrgLocation", OrgLocation_organizationId_placeId_key

### Community 16 - "escalate/route.ts"
Cohesion: 0.40
Nodes (5): dynamic, GET, POST, run(), sendExpiryNotices()

### Community 18 - "notFound"
Cohesion: 0.15
Nodes (35): bookingTransitionAction(), requireBookingSide(), forbidden(), invalid(), notFound(), notificationFailed(), listBookingDocuments(), MAX_BOOKING_DOCUMENTS (+27 more)

### Community 19 - "organizations/[id]/page.tsx"
Cohesion: 0.21
Nodes (17): AdminOrgPage(), AdminPage(), PlanCell(), STATUSES, TYPES, fmtDate(), EN, ORG_STATUS_LABEL (+9 more)

### Community 20 - "20261026110558_pilot_auth_ratelimit/migration.sql"
Cohesion: 0.53
Nodes (5): "PasswordResetToken", PasswordResetToken_tokenHash_key, PasswordResetToken_userId_idx, "RateLimitHit", RateLimitHit_key_createdAt_idx

### Community 21 - "tenders.ts"
Cohesion: 0.15
Nodes (20): Email, sendAll(), awardTender(), bidSchema, closeTender(), getTender(), listOpenTenders(), listOwnTenders() (+12 more)

### Community 22 - "server/push.ts"
Cohesion: 0.23
Nodes (13): appUrl(), b64url(), BUSINESS_ROLES, configure(), fcmAccessToken(), fcmPayload(), nativePushConfigured(), OrgPush (+5 more)

### Community 24 - "native.ts"
Cohesion: 0.09
Nodes (37): Android (`android/`), Bauen und testen, Einmalig: Konten, Hinweise für die Stores, iOS (`ios/`), Projekt erzeugen, Transferborsa Fahrer-App (iOS und Android), generateMetadata() (+29 more)

### Community 25 - "partners.ts"
Cohesion: 0.16
Nodes (28): splitHandoff(), requirePermission(), conflict(), acceptQuote(), cancelTermsSnapshot(), getTransferRequest(), ownVehicleId(), scopeSnapshot() (+20 more)

### Community 26 - "Transferborsa"
Cohesion: 0.06
Nodes (34): Berechtigungsmodell, Datenmodelle, Gewählte Architektur, Implementierungsplan, Live-Flottenkarte und Fahrer, Offene Fragen (Annahmen getroffen, reversibel), Phase 1: Ist-Zustand (26.10.2026), Phase 4: Reisebüros (Szenario B) (+26 more)

### Community 27 - "members.ts"
Cohesion: 0.06
Nodes (64): db, main(), zod, derive(), hashPassword(), verifyPassword(), createSession(), invalidateAllSessions() (+56 more)

### Community 28 - "lib/i18n.ts"
Cohesion: 0.15
Nodes (12): GET(), Locale, LOCALE_COOKIE, LOCALES, pickLocale(), T, translate(), Vars (+4 more)

### Community 29 - "notifications.ts"
Cohesion: 0.19
Nodes (23): fmtDateTime(), makeT(), formatCents(), deliver(), localeOf(), Note, note(), notifyBooked() (+15 more)

### Community 30 - "dispatch.ts"
Cohesion: 0.05
Nodes (58): maplibre-gl@^4.7.1, @maplibre/maplibre-gl-leaflet@^0.1.4, leaflet, maplibre-gl, @maplibre/maplibre-gl-leaflet, GET(), GET(), BoardMap() (+50 more)

### Community 32 - "renderConfirmationPdf"
Cohesion: 0.09
Nodes (27): GET(), GET(), GET(), GET(), POST(), CLOSED_BY_CANCEL, isCancelClosed(), NO_SHOW_WAIT_MINUTES (+19 more)

### Community 33 - ""PushSubscription""
Cohesion: 0.70
Nodes (4): "PushSubscription", PushSubscription_endpoint_key, PushSubscription_organizationId_idx, PushSubscription_userId_idx

### Community 34 - ""QuoteInvitation""
Cohesion: 0.83
Nodes (3): "QuoteInvitation", QuoteInvitation_providerOrgId_status_idx, QuoteInvitation_requestId_providerOrgId_key

### Community 35 - "test"
Cohesion: 0.08
Nodes (25): DATABASE_URL, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, jobs, test, name, on (+17 more)

### Community 36 - ""PartnerLink""
Cohesion: 0.83
Nodes (3): "PartnerLink", PartnerLink_orgId_partnerOrgId_key, PartnerLink_partnerOrgId_idx

### Community 37 - ""OrgBlock""
Cohesion: 0.83
Nodes (3): "OrgBlock", OrgBlock_blockedOrgId_idx, OrgBlock_orgId_blockedOrgId_key

### Community 38 - "package.json"
Cohesion: 0.14
Nodes (14): devDependencies, dotenv-cli@^11.0.0, prisma@^6.19.3, @types/leaflet@^1.9.22, @types/node@^22.20.5, @types/react@^19.3.0, @types/react-dom@^19.3.0, vitest@^3.2.4 (+6 more)

### Community 53 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 62 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @capacitor/core@^8.6.2, leaflet@^1.9.4, next@^15.5.28, pdf-lib@^1.17.1, @prisma/client@^6.19.3, react@^19.1.1, react-dom@^19.1.1 (+7 more)

### Community 76 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:demo, db:deploy, db:migrate, db:seed, dev, lint (+5 more)

## Knowledge Gaps
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getI18n` connect `getI18n` to `renderConfirmationPdf`, `Landing.tsx`, `organizations/[id]/page.tsx`, `native.ts`, `lib/i18n.ts`, `notifications.ts`, `dispatch.ts`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `20261026102414_phase3_marketplace/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.14666666666666667 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Landing.tsx` to `getI18n`, `package.json`, `dispatch.ts`, `native.ts`, `dependencies`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `mobile/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07862903225806452 - nodes in this community are weakly interconnected._
- **Why does `next` connect `getI18n` to `actions.ts`, `Landing.tsx`, `package.json`, `escalate/route.ts`, `organizations/[id]/page.tsx`, `next.config.ts`, `native.ts`, `lib/i18n.ts`, `dependencies`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `marketplace.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07307692307692308 - nodes in this community are weakly interconnected._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05455063381284717 - nodes in this community are weakly interconnected._