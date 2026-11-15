# Graph Report - taxi_route  (2026-11-15)

## Corpus Check
- 189 files · ~102,148 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .css 5, (none) 3, .example 1)

## Summary
- 1108 nodes · 4359 edges · 43 communities (38 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6f16803f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- db.ts
- mobile/package.json
- Landing.tsx
- marketplace.ts
- actions.ts
- getI18n
- LegalPage.tsx
- Pricing.tsx
- requirePermission
- driver.ts
- errors.ts
- lib/i18n.ts
- members.ts
- db.ts
- Product
- validation.ts
- verification-rules.ts
- vercel.json
- notFound
- organizations/[id]/page.tsx
- NightRoad.tsx
- tenders.ts
- server/push.ts
- next.config.ts
- native.ts
- partners.ts
- Transferborsa
- audit
- lib/i18n.ts
- notifications.ts
- dispatch.ts
- Startseite (/)
- renderConfirmationPdf
- services/push.ts
- TrackLive.tsx
- test
- Transferborsa Fahrer-App (iOS und Android)
- package.json
- compilerOptions
- dependencies
- scripts
- CLAUDE.md
- BILDNACHWEISE.md

## God Nodes (most connected - your core abstractions)
1. `requirePermission()` - 110 edges
2. `getI18n` - 101 edges
3. `getActor()` - 79 edges
4. `notFound()` - 68 edges
5. `runAction()` - 62 edges
6. `invalid()` - 57 edges
7. `db` - 52 edges
8. `actorCan()` - 51 edges
9. `parse()` - 44 edges
10. `next` - 43 edges

## Surprising Connections (you probably didn't know these)
- `org()` --calls--> `loadActor()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/authz/context.ts
- `org()` --calls--> `registerOrganization()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/registration.ts
- `main()` --calls--> `createVehicle()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/fleet.ts
- `main()` --calls--> `publishCapacity()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/fleet.ts
- `main()` --calls--> `acceptQuote()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts

## Import Cycles
- 2-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/notifications.ts`
- 3-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/services/booking-extras.ts -> src/server/notifications.ts`

## Communities (43 total, 5 thin omitted)

### Community 0 - "db.ts"
Cohesion: 0.15
Nodes (12): zod, db, globalForPrisma, Actor, agencyOverview(), transferInclude, TransferRow, Tx (+4 more)

### Community 1 - "mobile/package.json"
Cohesion: 0.08
Nodes (30): appUrl, config, dependencies, @capacitor/android@^8.6.2, @capacitor-community/background-geolocation@^1.3.1, @capacitor/core@^8.6.2, @capacitor-firebase/messaging@^8.6.0, @capacitor/ios@^8.6.2 (+22 more)

### Community 2 - "Landing.tsx"
Cohesion: 0.18
Nodes (14): react, Home(), Labels, HeroClaim(), Labels, AUDIENCE, Confirmation(), FAQ (+6 more)

### Community 3 - "marketplace.ts"
Cohesion: 0.09
Nodes (31): BoardFilter, boardFilterSchema, BOOKING_TO_REQUEST, BookingFrom, BookingTo, getTransferRequest(), MarketRequest, marketSelect (+23 more)

### Community 4 - "actions.ts"
Cohesion: 0.08
Nodes (76): acceptInvitationAction(), acceptQuoteAction(), addJobAlertAction(), addLocationAction(), addPartnerAction(), adminReviewCapabilityAction(), adminReviewDocumentAction(), adminSetOrgPlanAction() (+68 more)

### Community 5 - "getI18n"
Cohesion: 0.05
Nodes (131): next, server-only, RequestDetailPage(), stageIndex(), STAGES, TenderPage(), NewTenderPage(), DirectoryPage() (+123 more)

### Community 6 - "LegalPage.tsx"
Cohesion: 0.21
Nodes (9): Datenschutz(), metadata, Impressum(), metadata, NotFound(), metadata, Nutzungsbedingungen(), BackLink() (+1 more)

### Community 7 - "Pricing.tsx"
Cohesion: 0.15
Nodes (16): generateMetadata(), PreisePage(), dynamic, metadata, TrackPage(), AuthLayout(), Pricing(), SiteFooter() (+8 more)

### Community 8 - "requirePermission"
Cohesion: 0.13
Nodes (36): isPlaceId(), requirePermission(), notifyNewMessage(), adminReviewCapability(), adminReviewDocument(), audit(), deleteDocument(), uploadDocument() (+28 more)

### Community 9 - "driver.ts"
Cohesion: 0.17
Nodes (12): POST(), driverOverview(), openShift(), pointSchema, pointsSchema, POSITION_RETENTION_DAYS, POSITION_STALE_SECONDS, purgeOldPositions() (+4 more)

### Community 10 - "errors.ts"
Cohesion: 0.17
Nodes (16): GET(), GET(), AppError, AppErrorCode, switchActiveOrganization(), getBookingDocumentForDownload(), listBookingDocuments(), MAX_BOOKING_DOCUMENTS (+8 more)

### Community 11 - "lib/i18n.ts"
Cohesion: 0.19
Nodes (7): EN, translate(), PLACES, EVENT_LABEL, Tx, files(), keysInSource()

### Community 12 - "members.ts"
Cohesion: 0.29
Nodes (16): assignableRoles(), conflict(), forbidden(), acceptInvitation(), changeMemberRole(), consumeInvitation(), ensureNotLastOwner(), findOpenInvitation() (+8 more)

### Community 13 - "db.ts"
Cohesion: 0.20
Nodes (23): vitest, POST(), loadActor(), createTransferRequest(), takeFixedPriceRequest(), booked(), setup(), addDocument() (+15 more)

### Community 14 - "Product"
Cohesion: 0.20
Nodes (9): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Purpose (+1 more)

### Community 15 - "validation.ts"
Cohesion: 0.14
Nodes (10): DEFAULT_CAPABILITIES, countrySchema, memberRoleSchema, orgProfileSchema, phoneSchema, postalCodeSchema, registrationSchema, transportProfileSchema (+2 more)

### Community 16 - "verification-rules.ts"
Cohesion: 0.23
Nodes (11): dynamic, GET, POST, run(), appUrl(), Email, sendAll(), sendEmail() (+3 more)

### Community 18 - "notFound"
Cohesion: 0.16
Nodes (33): at(), driver(), liveFleetDemo(), main(), org(), trail(), bookingTransitionAction(), fromLocalInput() (+25 more)

### Community 19 - "organizations/[id]/page.tsx"
Cohesion: 0.14
Nodes (27): @prisma/client, AdminOrgPage(), AdminPage(), PlanCell(), STATUSES, TYPES, cache, df() (+19 more)

### Community 20 - "NightRoad.tsx"
Cohesion: 0.27
Nodes (11): buildScene(), DAY, drawTaxi(), layer(), NIGHT, NightRoad(), noise1(), Palette (+3 more)

### Community 21 - "tenders.ts"
Cohesion: 0.20
Nodes (10): bidSchema, listOpenTenders(), mail(), MailOrg, MailTender, notifyTenderCreated(), orgSelect, TenderRole (+2 more)

### Community 22 - "server/push.ts"
Cohesion: 0.23
Nodes (13): b64url(), BUSINESS_ROLES, configure(), fcmAccessToken(), fcmPayload(), nativePushConfigured(), OrgPush, sendFcm() (+5 more)

### Community 24 - "native.ts"
Cohesion: 0.11
Nodes (30): generateMetadata(), RootLayout(), NativeApp(), keyBytes(), PushText, PushToggle(), disable(), enable() (+22 more)

### Community 25 - "partners.ts"
Cohesion: 0.13
Nodes (23): HANDOFF_SHARE_OPTIONS, HandoffSplit, MAX_HANDOFF_SHARE_PERCENT, splitHandoff(), acceptQuote(), cancelTermsSnapshot(), ownVehicleId(), scopeSnapshot() (+15 more)

### Community 26 - "Transferborsa"
Cohesion: 0.06
Nodes (33): Berechtigungsmodell, Datenmodelle, Gewählte Architektur, Implementierungsplan, Live-Flottenkarte und Fahrer, Offene Fragen (Annahmen getroffen, reversibel), Phase 1: Ist-Zustand (26.10.2026), Phase 4: Reisebüros (Szenario B) (+25 more)

### Community 27 - "audit"
Cohesion: 0.16
Nodes (23): db, main(), derive(), hashPassword(), verifyPassword(), createSession(), invalidateAllSessions(), invalidateSession() (+15 more)

### Community 28 - "lib/i18n.ts"
Cohesion: 0.24
Nodes (8): GET(), Locale, LOCALE_COOKIE, LOCALES, T, Vars, fmt, safeInternalPath()

### Community 29 - "notifications.ts"
Cohesion: 0.21
Nodes (20): makeT(), formatCents(), deliver(), localeOf(), note(), notifyBooked(), notifyBookingReturned(), notifyBookingStatus() (+12 more)

### Community 30 - "dispatch.ts"
Cohesion: 0.05
Nodes (58): GET(), GET(), ago(), AUSTRIA, Basemap, duration(), esc(), headingOf() (+50 more)

### Community 32 - "renderConfirmationPdf"
Cohesion: 0.16
Nodes (14): GET(), MUTED, NAVY, ORANGE, renderConfirmationPdf(), RULE, SUBSTITUTE, SURFACE (+6 more)

### Community 33 - "services/push.ts"
Cohesion: 0.29
Nodes (8): DELETE(), fail(), POST(), nativeSchema, PUSH_HOSTS, removePushSubscription(), savePushSubscription(), subscriptionSchema

### Community 34 - "TrackLive.tsx"
Cohesion: 0.21
Nodes (11): maplibre-gl@^4.7.1, @maplibre/maplibre-gl-leaflet@^0.0.22, leaflet, maplibre-gl, @maplibre/maplibre-gl-leaflet, BoardMap(), BoardMapPoint, esc() (+3 more)

### Community 35 - "test"
Cohesion: 0.08
Nodes (25): DATABASE_URL, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, jobs, test, name, on (+17 more)

### Community 36 - "Transferborsa Fahrer-App (iOS und Android)"
Cohesion: 0.25
Nodes (7): Android (`android/`), Bauen und testen, Einmalig: Konten, Hinweise für die Stores, iOS (`ios/`), Projekt erzeugen, Transferborsa Fahrer-App (iOS und Android)

### Community 38 - "package.json"
Cohesion: 0.10
Nodes (26): description, devDependencies, dotenv-cli@^11.0.0, prisma@^6.19.3, tsx@^4.23.15, @types/leaflet@^1.9.22, @types/node@^22.20.5, @types/react@^19.3.0 (+18 more)

### Community 53 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 62 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @capacitor/core@^8.6.2, @fontsource-variable/albert-sans@^5.3.0, @fontsource-variable/imbue@^5.3.0, leaflet@^1.9.4, next@^15.5.28, pdf-lib@^1.17.1, @prisma/client@^6.19.3 (+11 more)

### Community 76 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:demo, db:deploy, db:migrate, db:seed, dev, lint (+5 more)

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `getI18n` to `Landing.tsx`, `actions.ts`, `package.json`, `LegalPage.tsx`, `Pricing.tsx`, `verification-rules.ts`, `organizations/[id]/page.tsx`, `next.config.ts`, `native.ts`, `lib/i18n.ts`, `dependencies`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `mobile/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07862903225806452 - nodes in this community are weakly interconnected._
- **Why does `getI18n` connect `getI18n` to `renderConfirmationPdf`, `Landing.tsx`, `LegalPage.tsx`, `Pricing.tsx`, `db.ts`, `organizations/[id]/page.tsx`, `native.ts`, `notifications.ts`, `dispatch.ts`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Should `marketplace.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08558558558558559 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Landing.tsx` to `TrackLive.tsx`, `getI18n`, `package.json`, `Pricing.tsx`, `NightRoad.tsx`, `dispatch.ts`, `native.ts`, `dependencies`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08491508491508491 - nodes in this community are weakly interconnected._
- **Should `getI18n` be split into smaller, more focused modules?**
  _Cohesion score 0.054994778976679426 - nodes in this community are weakly interconnected._