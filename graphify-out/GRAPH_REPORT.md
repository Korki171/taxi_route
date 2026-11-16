# Graph Report - taxi_route-hero  (2026-11-16)

## Corpus Check
- 209 files · ~112,137 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 5, (none) 4, .example 1)

## Summary
- 1305 nodes · 4978 edges · 73 communities (58 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c5bbdcdb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 20261026102414_phase3_marketplace/migration.sql
- mobile/package.json
- "Organization"
- marketplace.ts
- actions.ts
- boerse/page.tsx
- flotte/page.tsx
- Landing.tsx
- messages.ts
- driver.ts
- getI18n
- 20261115230000_tenders/migration.sql
- 20261027161101_live_fleet_tracking/migration.sql
- db.ts
- Product
- "Rating"
- organization/page.tsx
- vercel.json
- requirePermission
- organizations/[id]/page.tsx
- 20261026110558_pilot_auth_ratelimit/migration.sql
- tenders.ts
- errors.ts
- next.config.ts
- native.ts
- partners.ts
- Transferborsa
- auth.ts
- places.ts
- db.ts
- LiveMap.tsx
- Startseite (/)
- renderConfirmationPdf
- "PushSubscription"
- "QuoteInvitation"
- test
- "PartnerLink"
- "OrgBlock"
- package.json
- "BookingDocument"
- AppShell.tsx
- auftrag/[id]/page.tsx
- "LoginChallenge"
- validation.ts
- demo-boerse.ts
- dispatch.ts
- compilerOptions
- members.ts
- NightRoad.tsx
- context.ts
- parse
- TrackLive.tsx
- text-filter.ts
- permissions.ts
- Pricing.tsx
- dependencies
- LegalPage
- fahrer/page.tsx
- price-guide.ts
- tracking.ts
- ShellNav.tsx
- plans.test.ts
- "OrgLocation"
- scripts
- CLAUDE.md
- BILDNACHWEISE.md

## God Nodes (most connected - your core abstractions)
1. `requirePermission()` - 118 edges
2. `getI18n` - 114 edges
3. `getActor()` - 89 edges
4. `notFound()` - 73 edges
5. `runAction()` - 70 edges
6. `invalid()` - 62 edges
7. `actorCan()` - 57 edges
8. `db` - 57 edges
9. `next` - 48 edges
10. `Flash()` - 47 edges

## Surprising Connections (you probably didn't know these)
- `Transferborsa Fahrer-App (iOS und Android)` --references--> `NativeApp()`  [INFERRED]
  mobile/README.md → src/components/NativeApp.tsx
- `Transferborsa Fahrer-App (iOS und Android)` --references--> `PushToggle()`  [INFERRED]
  mobile/README.md → src/components/PushToggle.tsx
- `Transferborsa Fahrer-App (iOS und Android)` --references--> `ShiftTracker()`  [INFERRED]
  mobile/README.md → src/components/ShiftTracker.tsx
- `booked()` --calls--> `takeFixedPriceRequest()`  [EXTRACTED]
  tests/ratings.test.ts → src/server/services/marketplace.ts
- `liveFleetDemo()` --calls--> `createTransferRequest()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts

## Import Cycles
- 2-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/notifications.ts`
- 3-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/services/booking-extras.ts -> src/server/notifications.ts`

## Communities (73 total, 15 thin omitted)

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
Cohesion: 0.10
Nodes (33): HANDOFF_SHARE_OPTIONS, HandoffSplit, MAX_HANDOFF_SHARE_PERCENT, splitHandoff(), acceptQuote(), BoardFilter, boardFilterSchema, BOOKING_TO_REQUEST (+25 more)

### Community 4 - "actions.ts"
Cohesion: 0.06
Nodes (99): acceptInvitationAction(), acceptQuoteAction(), addJobAlertAction(), addLocationAction(), addPartnerAction(), adminResolveRatingReportAction(), adminReviewCapabilityAction(), adminReviewDocumentAction() (+91 more)

### Community 5 - "boerse/page.tsx"
Cohesion: 0.13
Nodes (39): BoersePage(), BookingsView(), CapacityMarketView(), CHIP_HIDDEN, FILTER_KEYS, GROUPS, InvitationsView(), MarketView() (+31 more)

### Community 6 - "flotte/page.tsx"
Cohesion: 0.22
Nodes (11): FleetPage(), RouteGuide(), cache, df(), fmtDateTime(), fmtMinutes(), fmtTime(), tag() (+3 more)

### Community 7 - "Landing.tsx"
Cohesion: 0.16
Nodes (14): react, Home(), Labels, HeroClaim(), Labels, AUDIENCE, Confirmation(), FAQ (+6 more)

### Community 8 - "messages.ts"
Cohesion: 0.23
Nodes (11): access(), addJobAlert(), alertSchema, canWrite(), listJobAlerts(), listThreads(), MAX_JOB_ALERTS, MAX_MESSAGE_LENGTH (+3 more)

### Community 9 - "driver.ts"
Cohesion: 0.15
Nodes (14): POST(), driverOverview(), endShift(), openShift(), pointSchema, pointsSchema, POSITION_RETENTION_DAYS, POSITION_STALE_SECONDS (+6 more)

### Community 10 - "getI18n"
Cohesion: 0.21
Nodes (19): next, POST(), InvitePage(), LoginCodePage(), LoginPage(), DocumentsPage(), ForgotPasswordPage(), ResetPasswordPage() (+11 more)

### Community 11 - "20261115230000_tenders/migration.sql"
Cohesion: 0.42
Nodes (8): "Tender", Tender_awardedBidId_key, Tender_number_key, Tender_requesterOrgId_idx, Tender_status_bidDeadline_idx, "TenderBid", TenderBid_providerOrgId_idx, TenderBid_tenderId_providerOrgId_key

### Community 12 - "20261027161101_live_fleet_tracking/migration.sql"
Cohesion: 0.43
Nodes (7): Booking_driverId_idx, "DriverShift", DriverShift_organizationId_endedAt_idx, DriverShift_userId_endedAt_idx, "PositionPing", PositionPing_recordedAt_idx, PositionPing_shiftId_recordedAt_idx

### Community 13 - "db.ts"
Cohesion: 0.17
Nodes (25): vitest, loadActor(), sentEmails, checkInvitees(), createTransferRequest(), booked(), setup(), addDocument() (+17 more)

### Community 14 - "Product"
Cohesion: 0.20
Nodes (9): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Purpose (+1 more)

### Community 15 - ""Rating""
Cohesion: 0.39
Nodes (6): "Rating", Rating_bookingId_fromOrgId_key, Rating_toOrgId_idx, "RatingReport", RatingReport_ratingId_orgId_key, RatingReport_resolvedAt_idx

### Community 16 - "organization/page.tsx"
Cohesion: 0.20
Nodes (25): server-only, RequestDetailPage(), TenderPage(), NewTenderPage(), DirectoryPage(), NewRequestPage(), MembersPage(), ROLE_HELP (+17 more)

### Community 18 - "requirePermission"
Cohesion: 0.12
Nodes (43): bookingTransitionAction(), isPlaceId(), requirePermission(), invalid(), notFound(), notificationFailed(), returnBooking(), assignBooking() (+35 more)

### Community 19 - "organizations/[id]/page.tsx"
Cohesion: 0.19
Nodes (17): AdminRatingReportsPage(), AdminOrgPage(), AdminPage(), PlanCell(), STATUSES, TYPES, NoOrg(), fmtDate() (+9 more)

### Community 20 - "20261026110558_pilot_auth_ratelimit/migration.sql"
Cohesion: 0.53
Nodes (5): "PasswordResetToken", PasswordResetToken_tokenHash_key, PasswordResetToken_userId_idx, "RateLimitHit", RateLimitHit_key_createdAt_idx

### Community 21 - "tenders.ts"
Cohesion: 0.05
Nodes (74): dynamic, GET, POST, run(), GET(), PushSetup(), Locale, LOCALE_COOKIE (+66 more)

### Community 22 - "errors.ts"
Cohesion: 0.15
Nodes (20): GET(), GET(), requireBookingSide(), AppError, AppErrorCode, forbidden(), getBookingDocumentForDownload(), listBookingDocuments() (+12 more)

### Community 24 - "native.ts"
Cohesion: 0.09
Nodes (37): Android (`android/`), Bauen und testen, Einmalig: Konten, Hinweise für die Stores, iOS (`ios/`), Projekt erzeugen, Transferborsa Fahrer-App (iOS und Android), generateMetadata() (+29 more)

### Community 25 - "partners.ts"
Cohesion: 0.26
Nodes (10): getTransferRequest(), addPartner(), blockOrg(), ESCALATE_CHOICES, ESCALATE_LABEL, escalationDefault(), listPartnerCandidates(), MAX_PARTNERS (+2 more)

### Community 26 - "Transferborsa"
Cohesion: 0.06
Nodes (34): Berechtigungsmodell, Datenmodelle, Gewählte Architektur, Implementierungsplan, Live-Flottenkarte und Fahrer, Offene Fragen (Annahmen getroffen, reversibel), Phase 1: Ist-Zustand (26.10.2026), Phase 4: Reisebüros (Szenario B) (+26 more)

### Community 27 - "auth.ts"
Cohesion: 0.15
Nodes (28): db, main(), zod, derive(), hashPassword(), verifyPassword(), createSession(), invalidateAllSessions() (+20 more)

### Community 28 - "places.ts"
Cohesion: 0.17
Nodes (9): EN, BY_ID, Place, PLACES, Point, REGION_LABEL, EVENT_LABEL, files() (+1 more)

### Community 29 - "db.ts"
Cohesion: 0.17
Nodes (14): @prisma/client, db, globalForPrisma, categoryFits(), findMatchesForCapacity(), listCapacityWithMatches(), matchCapacity(), MatchInput (+6 more)

### Community 30 - "LiveMap.tsx"
Cohesion: 0.17
Nodes (17): ago(), AUSTRIA, Basemap, duration(), esc(), headingOf(), legLabels(), legRoles() (+9 more)

### Community 32 - "renderConfirmationPdf"
Cohesion: 0.11
Nodes (21): GET(), GET(), ShareLink(), share(), CLOSED_BY_CANCEL, isCancelClosed(), NO_SHOW_WAIT_MINUTES, NO_SHOW_WAIT_MINUTES_FLIGHT (+13 more)

### Community 33 - ""PushSubscription""
Cohesion: 0.70
Nodes (4): "PushSubscription", PushSubscription_endpoint_key, PushSubscription_organizationId_idx, PushSubscription_userId_idx

### Community 34 - ""QuoteInvitation""
Cohesion: 0.38
Nodes (5): "QuoteInvitation", QuoteInvitation_providerOrgId_status_idx, QuoteInvitation_requestId_providerOrgId_key, "Message", Message_requestId_threadOrgId_createdAt_idx

### Community 35 - "test"
Cohesion: 0.08
Nodes (25): DATABASE_URL, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, jobs, test, name, on (+17 more)

### Community 36 - ""PartnerLink""
Cohesion: 0.38
Nodes (5): "PartnerLink", PartnerLink_orgId_partnerOrgId_key, PartnerLink_partnerOrgId_idx, "JobAlert", JobAlert_organizationId_idx

### Community 37 - ""OrgBlock""
Cohesion: 0.83
Nodes (3): "OrgBlock", OrgBlock_blockedOrgId_idx, OrgBlock_orgId_blockedOrgId_key

### Community 38 - "package.json"
Cohesion: 0.10
Nodes (26): description, devDependencies, dotenv-cli@^11.0.0, prisma@^6.19.3, tsx@^4.23.15, @types/leaflet@^1.9.22, @types/node@^22.20.5, @types/react@^19.3.0 (+18 more)

### Community 40 - "AppShell.tsx"
Cohesion: 0.19
Nodes (13): dynamic, generateMetadata(), Props, SharedRequestPage(), NotFound(), dynamic, metadata, TrackPage() (+5 more)

### Community 41 - "auftrag/[id]/page.tsx"
Cohesion: 0.14
Nodes (18): stageIndex(), STAGES, BOOKING_STATUS_LABEL, INVITATION_STATUS_LABEL, priceStateLabel(), QUOTE_STATUS_LABEL, ROLE_LABEL, statusTone() (+10 more)

### Community 43 - "validation.ts"
Cohesion: 0.12
Nodes (14): DEFAULT_CAPABILITIES, PHONE_COUNTRY, Registration, countrySchema, memberRoleSchema, orgProfileSchema, passwordSchema, phoneSchema (+6 more)

### Community 51 - "demo-boerse.ts"
Cohesion: 0.19
Nodes (17): at(), driver(), liveFleetDemo(), main(), org(), trail(), capacitySchema, createVehicle() (+9 more)

### Community 52 - "dispatch.ts"
Cohesion: 0.20
Nodes (15): GET(), haversineKm(), nearestPlace(), assignSchema, DRIVING_ROLES, listDispatchBookings(), listDrivers(), liveFleet() (+7 more)

### Community 53 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 54 - "members.ts"
Cohesion: 0.29
Nodes (15): assignableRoles(), conflict(), acceptInvitation(), changeMemberRole(), consumeInvitation(), ensureNotLastOwner(), findOpenInvitation(), getInvitationPreview() (+7 more)

### Community 55 - "NightRoad.tsx"
Cohesion: 0.20
Nodes (13): buildScene(), DAY, drawTaxi(), layer(), NIGHT, NightRoad(), noise1(), Palette (+5 more)

### Community 56 - "context.ts"
Cohesion: 0.17
Nodes (10): Actor, OrgActor, orgSelect, nativeSchema, PUSH_HOSTS, subscriptionSchema, median(), orgStats() (+2 more)

### Community 57 - "parse"
Cohesion: 0.28
Nodes (14): requirePlatformAdmin(), adminGetOrganization(), adminListOrganizations(), adminReviewCapability(), adminReviewDocument(), adminSetOrganizationPlan(), adminSetOrganizationStatus(), reviewSchema (+6 more)

### Community 58 - "TrackLive.tsx"
Cohesion: 0.21
Nodes (11): maplibre-gl@^4.7.1, @maplibre/maplibre-gl-leaflet@^0.1.4, leaflet, maplibre-gl, @maplibre/maplibre-gl-leaflet, BoardMap(), BoardMapPoint, esc() (+3 more)

### Community 59 - "text-filter.ts"
Cohesion: 0.21
Nodes (13): ALLOWED, BAD, BAD_WORDS, checkText(), containsBadWord(), hasPhone(), LEET, maskedBadWord() (+5 more)

### Community 60 - "permissions.ts"
Cohesion: 0.21
Nodes (10): ALL, can(), decide(), Decision, OrgAuthzInput, Permission, PERMISSION_CAPABILITY, PERMISSIONS (+2 more)

### Community 61 - "Pricing.tsx"
Cohesion: 0.30
Nodes (8): generateMetadata(), PreisePage(), Pricing(), Labels, ThemeToggle(), HpTheme, THEME_ORDER, themeFromCookie()

### Community 62 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @capacitor/core@^8.6.2, @fontsource-variable/albert-sans@^5.3.0, @fontsource-variable/imbue@^5.3.0, leaflet@^1.9.4, next@^15.5.28, pdf-lib@^1.17.1, @prisma/client@^6.19.3 (+11 more)

### Community 63 - "LegalPage"
Cohesion: 0.27
Nodes (7): Datenschutz(), metadata, Impressum(), metadata, metadata, Nutzungsbedingungen(), LegalPage()

### Community 64 - "fahrer/page.tsx"
Cohesion: 0.29
Nodes (7): DriverPage(), metadata, navUrl(), NEXT_STEP, LocationStep(), LocationStepText, noShowAllowedFrom()

### Community 65 - "price-guide.ts"
Cohesion: 0.33
Nodes (7): estimateMinutes(), getPlace(), MIN_PRICE_EUR, PRICE_PER_KM_HIGH, PRICE_PER_KM_LOW, round5(), routeGuide()

### Community 66 - "tracking.ts"
Cohesion: 0.38
Nodes (5): GET(), ROAD_FACTOR, trackingView(), TrackPoint, TrackView

### Community 67 - "ShellNav.tsx"
Cohesion: 0.40
Nodes (3): currentHref(), NavItem, ShellNav()

### Community 68 - "plans.test.ts"
Cohesion: 0.60
Nodes (3): PLAN_STATUS_TONE, PLANS, PlanStatus

### Community 76 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:demo, db:deploy, db:migrate, db:seed, dev, lint (+5 more)

## Knowledge Gaps
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getI18n` connect `getI18n` to `renderConfirmationPdf`, `fahrer/page.tsx`, `tracking.ts`, `boerse/page.tsx`, `flotte/page.tsx`, `Landing.tsx`, `AppShell.tsx`, `auftrag/[id]/page.tsx`, `organization/page.tsx`, `organizations/[id]/page.tsx`, `dispatch.ts`, `tenders.ts`, `native.ts`, `Pricing.tsx`, `LegalPage`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Should `20261026102414_phase3_marketplace/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.14666666666666667 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Landing.tsx` to `fahrer/page.tsx`, `renderConfirmationPdf`, `ShellNav.tsx`, `package.json`, `flotte/page.tsx`, `AppShell.tsx`, `auftrag/[id]/page.tsx`, `getI18n`, `LiveMap.tsx`, `NightRoad.tsx`, `native.ts`, `TrackLive.tsx`, `Pricing.tsx`, `dependencies`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `mobile/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07862903225806452 - nodes in this community are weakly interconnected._
- **Why does `next` connect `getI18n` to `fahrer/page.tsx`, `ShellNav.tsx`, `actions.ts`, `boerse/page.tsx`, `package.json`, `flotte/page.tsx`, `AppShell.tsx`, `auftrag/[id]/page.tsx`, `Landing.tsx`, `organization/page.tsx`, `organizations/[id]/page.tsx`, `tenders.ts`, `NightRoad.tsx`, `next.config.ts`, `native.ts`, `Pricing.tsx`, `dependencies`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Should `marketplace.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09851551956815115 - nodes in this community are weakly interconnected._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.061239731142643763 - nodes in this community are weakly interconnected._