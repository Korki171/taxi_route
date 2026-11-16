# Graph Report - taxi_route-hero  (2026-11-16)

## Corpus Check
- 209 files · ~113,264 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 5, (none) 4, .example 1)

## Summary
- 1311 nodes · 4999 edges · 75 communities (58 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6c361cba`
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
- next
- messages.ts
- driver.ts
- register/page.tsx
- 20261115230000_tenders/migration.sql
- 20261027161101_live_fleet_tracking/migration.sql
- db.ts
- Product
- "Rating"
- organization/page.tsx
- vercel.json
- notFound
- organization/page.tsx
- 20261026110558_pilot_auth_ratelimit/migration.sql
- notifications.ts
- errors.ts
- next.config.ts
- native.ts
- server/push.ts
- Transferborsa
- auth.ts
- lib/i18n.ts
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
- tenders.ts
- auftrag/[id]/page.tsx
- "LoginChallenge"
- validation.ts
- demo-boerse.ts
- dispatch.ts
- compilerOptions
- members.ts
- NightRoad.tsx
- services/push.ts
- parse
- TrackLive.tsx
- text-filter.ts
- permissions.ts
- verification-rules.ts
- dependencies
- LegalPage
- fahrer/page.tsx
- places.ts
- package.json
- ratings.ts
- rating-rules.ts
- "OrgLocation"
- ClaimOrder.tsx
- @types/web-push@^3.6.4
- scripts
- CLAUDE.md
- BILDNACHWEISE.md

## God Nodes (most connected - your core abstractions)
1. `requirePermission()` - 118 edges
2. `getI18n` - 116 edges
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
- `driver()` --calls--> `loadActor()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/authz/context.ts
- `org()` --calls--> `loadActor()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/authz/context.ts

## Import Cycles
- 2-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/notifications.ts`
- 3-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/services/booking-extras.ts -> src/server/notifications.ts`

## Communities (75 total, 17 thin omitted)

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
Cohesion: 0.09
Nodes (24): HANDOFF_SHARE_OPTIONS, HandoffSplit, MAX_HANDOFF_SHARE_PERCENT, Place, BoardFilter, boardFilterSchema, BOOKING_TO_REQUEST, BookingFrom (+16 more)

### Community 4 - "actions.ts"
Cohesion: 0.06
Nodes (98): acceptInvitationAction(), acceptQuoteAction(), addJobAlertAction(), addLocationAction(), addPartnerAction(), adminResolveRatingReportAction(), adminReviewCapabilityAction(), adminReviewDocumentAction() (+90 more)

### Community 5 - "boerse/page.tsx"
Cohesion: 0.13
Nodes (42): BoersePage(), BookingsView(), CapacityMarketView(), CHIP_HIDDEN, FILTER_KEYS, GROUPS, InvitationsView(), MarketView() (+34 more)

### Community 6 - "flotte/page.tsx"
Cohesion: 0.23
Nodes (9): POST(), RouteGuide(), cache, df(), fmtDateTime(), fmtMinutes(), fmtTime(), tag() (+1 more)

### Community 7 - "next"
Cohesion: 0.09
Nodes (35): next, react, LoginCodePage(), LoginPage(), Home(), ForgotPasswordPage(), ResetPasswordPage(), generateMetadata() (+27 more)

### Community 8 - "messages.ts"
Cohesion: 0.17
Nodes (19): isPlaceId(), requirePermission(), access(), alertSchema, canWrite(), listJobAlerts(), listThreads(), MAX_JOB_ALERTS (+11 more)

### Community 9 - "driver.ts"
Cohesion: 0.15
Nodes (14): POST(), driverOverview(), endShift(), openShift(), pointSchema, pointsSchema, POSITION_RETENTION_DAYS, POSITION_STALE_SECONDS (+6 more)

### Community 10 - "register/page.tsx"
Cohesion: 0.62
Nodes (4): RegisterPage(), Org, OrgProfileFields(), Req()

### Community 11 - "20261115230000_tenders/migration.sql"
Cohesion: 0.42
Nodes (8): "Tender", Tender_awardedBidId_key, Tender_number_key, Tender_requesterOrgId_idx, Tender_status_bidDeadline_idx, "TenderBid", TenderBid_providerOrgId_idx, TenderBid_tenderId_providerOrgId_key

### Community 12 - "20261027161101_live_fleet_tracking/migration.sql"
Cohesion: 0.43
Nodes (7): Booking_driverId_idx, "DriverShift", DriverShift_organizationId_endedAt_idx, DriverShift_userId_endedAt_idx, "PositionPing", PositionPing_recordedAt_idx, PositionPing_shiftId_recordedAt_idx

### Community 13 - "db.ts"
Cohesion: 0.16
Nodes (31): vitest, db, loadActor(), createTransferRequest(), getTransferRequest(), takeFixedPriceRequest(), addPartner(), blockOrg() (+23 more)

### Community 14 - "Product"
Cohesion: 0.20
Nodes (9): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Purpose (+1 more)

### Community 15 - ""Rating""
Cohesion: 0.39
Nodes (6): "Rating", Rating_bookingId_fromOrgId_key, Rating_toOrgId_idx, "RatingReport", RatingReport_ratingId_orgId_key, RatingReport_resolvedAt_idx

### Community 16 - "organization/page.tsx"
Cohesion: 0.26
Nodes (24): NewTenderPage(), DirectoryPage(), NewRequestPage(), DriverPage(), FleetPage(), InvitePage(), DocumentsPage(), MembersPage() (+16 more)

### Community 18 - "notFound"
Cohesion: 0.15
Nodes (35): bookingTransitionAction(), splitHandoff(), invalid(), notFound(), notificationFailed(), returnBooking(), advanceTrip(), acceptQuote() (+27 more)

### Community 19 - "organization/page.tsx"
Cohesion: 0.12
Nodes (28): server-only, AdminRatingReportsPage(), AdminOrgPage(), AdminPage(), PlanCell(), STATUSES, TYPES, NoOrg() (+20 more)

### Community 20 - "20261026110558_pilot_auth_ratelimit/migration.sql"
Cohesion: 0.53
Nodes (5): "PasswordResetToken", PasswordResetToken_tokenHash_key, PasswordResetToken_userId_idx, "RateLimitHit", RateLimitHit_key_createdAt_idx

### Community 21 - "notifications.ts"
Cohesion: 0.22
Nodes (20): makeT(), formatCents(), deliver(), localeOf(), Note, note(), notifyBooked(), notifyBookingReturned() (+12 more)

### Community 22 - "errors.ts"
Cohesion: 0.11
Nodes (27): GET(), GET(), Actor, authzInput(), OrgActor, requireBookingSide(), AppError, AppErrorCode (+19 more)

### Community 24 - "native.ts"
Cohesion: 0.09
Nodes (37): Android (`android/`), Bauen und testen, Einmalig: Konten, Hinweise für die Stores, iOS (`ios/`), Projekt erzeugen, Transferborsa Fahrer-App (iOS und Android), generateMetadata() (+29 more)

### Community 25 - "server/push.ts"
Cohesion: 0.19
Nodes (16): PushSetup(), notifyDriverAssigned(), b64url(), BUSINESS_ROLES, configure(), fcmAccessToken(), fcmPayload(), nativePushConfigured() (+8 more)

### Community 26 - "Transferborsa"
Cohesion: 0.06
Nodes (34): Berechtigungsmodell, Datenmodelle, Gewählte Architektur, Implementierungsplan, Live-Flottenkarte und Fahrer, Offene Fragen (Annahmen getroffen, reversibel), Phase 1: Ist-Zustand (26.10.2026), Phase 4: Reisebüros (Szenario B) (+26 more)

### Community 27 - "auth.ts"
Cohesion: 0.16
Nodes (26): db, main(), derive(), hashPassword(), verifyPassword(), createSession(), invalidateAllSessions(), invalidateSession() (+18 more)

### Community 28 - "lib/i18n.ts"
Cohesion: 0.13
Nodes (14): GET(), EN, Locale, LOCALE_COOKIE, LOCALES, T, translate(), Vars (+6 more)

### Community 29 - "db.ts"
Cohesion: 0.19
Nodes (12): @prisma/client, globalForPrisma, categoryFits(), findMatchesForCapacity(), listCapacityWithMatches(), matchCapacity(), MatchInput, MatchResult (+4 more)

### Community 30 - "LiveMap.tsx"
Cohesion: 0.17
Nodes (17): ago(), AUSTRIA, Basemap, duration(), esc(), headingOf(), legLabels(), legRoles() (+9 more)

### Community 32 - "renderConfirmationPdf"
Cohesion: 0.16
Nodes (17): GET(), GET(), share(), isCancelClosed(), MUTED, NAVY, ORANGE, renderConfirmationPdf() (+9 more)

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
Cohesion: 0.12
Nodes (16): devDependencies, dotenv-cli@^11.0.0, prisma@^6.19.3, @types/leaflet@^1.9.22, @types/node@^22.20.5, @types/react@^19.3.0, @types/react-dom@^19.3.0, typescript@^5.9.3 (+8 more)

### Community 40 - "tenders.ts"
Cohesion: 0.18
Nodes (13): Email, bidSchema, getTender(), listOpenTenders(), mail(), MailOrg, MailTender, notifyTenderCreated() (+5 more)

### Community 41 - "auftrag/[id]/page.tsx"
Cohesion: 0.15
Nodes (24): RequestDetailPage(), stageIndex(), STAGES, TenderPage(), ShareLink(), StarMark(), StarRow(), Stars() (+16 more)

### Community 43 - "validation.ts"
Cohesion: 0.10
Nodes (16): zod, capacitySchema, place, vehicleCategory, vehicleSchema, countrySchema, memberRoleSchema, orgProfileSchema (+8 more)

### Community 51 - "demo-boerse.ts"
Cohesion: 0.18
Nodes (21): at(), driver(), liveFleetDemo(), main(), org(), trail(), assignBooking(), createVehicle() (+13 more)

### Community 52 - "dispatch.ts"
Cohesion: 0.20
Nodes (13): GET(), assignSchema, DRIVING_ROLES, listDispatchBookings(), listDrivers(), liveFleet(), LiveLeg, LivePoint (+5 more)

### Community 53 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 54 - "members.ts"
Cohesion: 0.27
Nodes (17): assignableRoles(), conflict(), forbidden(), acceptInvitation(), changeMemberRole(), consumeInvitation(), ensureNotLastOwner(), findOpenInvitation() (+9 more)

### Community 55 - "NightRoad.tsx"
Cohesion: 0.27
Nodes (11): buildScene(), DAY, drawTaxi(), layer(), NIGHT, NightRoad(), noise1(), Palette (+3 more)

### Community 56 - "services/push.ts"
Cohesion: 0.29
Nodes (8): DELETE(), fail(), POST(), nativeSchema, PUSH_HOSTS, removePushSubscription(), savePushSubscription(), subscriptionSchema

### Community 57 - "parse"
Cohesion: 0.25
Nodes (13): fromLocalInput(), requirePlatformAdmin(), adminGetOrganization(), adminListOrganizations(), adminReviewCapability(), adminReviewDocument(), adminSetOrganizationPlan(), adminSetOrganizationStatus() (+5 more)

### Community 58 - "TrackLive.tsx"
Cohesion: 0.21
Nodes (11): maplibre-gl@^4.7.1, @maplibre/maplibre-gl-leaflet@^0.1.4, leaflet, maplibre-gl, @maplibre/maplibre-gl-leaflet, BoardMap(), BoardMapPoint, esc() (+3 more)

### Community 59 - "text-filter.ts"
Cohesion: 0.21
Nodes (13): ALLOWED, BAD, BAD_WORDS, checkText(), containsBadWord(), hasPhone(), LEET, maskedBadWord() (+5 more)

### Community 60 - "permissions.ts"
Cohesion: 0.21
Nodes (10): ALL, can(), decide(), Decision, OrgAuthzInput, Permission, PERMISSION_CAPABILITY, PERMISSIONS (+2 more)

### Community 61 - "verification-rules.ts"
Cohesion: 0.24
Nodes (10): dynamic, GET, POST, run(), appUrl(), sendAll(), escalateDueRequests(), expiringDocuments() (+2 more)

### Community 62 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @capacitor/core@^8.6.2, @fontsource-variable/albert-sans@^5.3.0, @fontsource-variable/imbue@^5.3.0, leaflet@^1.9.4, next@^15.5.28, @prisma/client@^6.19.3, react@^19.1.1 (+9 more)

### Community 63 - "LegalPage"
Cohesion: 0.18
Nodes (9): Datenschutz(), metadata, Impressum(), metadata, NotFound(), metadata, Nutzungsbedingungen(), BackLink() (+1 more)

### Community 64 - "fahrer/page.tsx"
Cohesion: 0.12
Nodes (21): dynamic, generateMetadata(), Props, SharedRequestPage(), CurrentTrip(), metadata, navUrl(), NEXT_STEP (+13 more)

### Community 65 - "places.ts"
Cohesion: 0.18
Nodes (16): GET(), BY_ID, estimateMinutes(), getPlace(), haversineKm(), nearestPlace(), Point, ROAD_FACTOR (+8 more)

### Community 66 - "package.json"
Cohesion: 0.18
Nodes (10): pdf-lib@^1.17.1, description, tsx@^4.23.15, name, prisma, seed, private, version (+2 more)

### Community 67 - "ratings.ts"
Cohesion: 0.24
Nodes (8): adminListRatingReports(), checked(), isVisible(), RatingSummary, replyToRating(), score, textSchema, Tx

### Community 68 - "rating-rules.ts"
Cohesion: 0.33
Nodes (5): RATING_CATEGORIES, RATING_CATEGORY_LABEL, RATING_MIN_PUBLIC, RATING_WINDOW_DAYS, RatingCategory

### Community 76 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:demo, db:deploy, db:migrate, db:seed, dev, lint (+5 more)

## Knowledge Gaps
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getI18n` connect `organization/page.tsx` to `fahrer/page.tsx`, `places.ts`, `renderConfirmationPdf`, `boerse/page.tsx`, `flotte/page.tsx`, `next`, `auftrag/[id]/page.tsx`, `register/page.tsx`, `organization/page.tsx`, `dispatch.ts`, `notifications.ts`, `native.ts`, `server/push.ts`, `LegalPage`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `20261026102414_phase3_marketplace/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.14666666666666667 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `fahrer/page.tsx`, `package.json`, `actions.ts`, `boerse/page.tsx`, `flotte/page.tsx`, `auftrag/[id]/page.tsx`, `register/page.tsx`, `organization/page.tsx`, `organization/page.tsx`, `next.config.ts`, `native.ts`, `lib/i18n.ts`, `verification-rules.ts`, `dependencies`, `LegalPage`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `mobile/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07862903225806452 - nodes in this community are weakly interconnected._
- **Why does `react` connect `next` to `fahrer/page.tsx`, `package.json`, `ClaimOrder.tsx`, `flotte/page.tsx`, `auftrag/[id]/page.tsx`, `organization/page.tsx`, `LiveMap.tsx`, `NightRoad.tsx`, `native.ts`, `TrackLive.tsx`, `dependencies`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `marketplace.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08620689655172414 - nodes in this community are weakly interconnected._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0634828188701223 - nodes in this community are weakly interconnected._