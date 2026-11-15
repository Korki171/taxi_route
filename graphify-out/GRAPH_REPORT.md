# Graph Report - taxi_route  (2026-11-15)

## Corpus Check
- 162 files · ~88,895 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .css 5, (none) 2, .example 1)

## Summary
- 964 nodes · 3722 edges · 36 communities (32 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f3f32f39`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- demo-boerse.ts
- notFound
- LiveMap.tsx
- marketplace.ts
- actions.ts
- getI18n
- weitergabe.yml
- Landing.tsx
- invalid
- driver.ts
- context.ts
- organizations/[id]/page.tsx
- members.ts
- createTransferRequest
- Product
- db.ts
- members.ts
- vercel.json
- errors.ts
- validation.ts
- ShiftTracker.tsx
- Pricing.tsx
- server/push.ts
- context.ts
- PushToggle.tsx
- Transferborsa
- audit
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
1. `requirePermission()` - 95 edges
2. `getI18n` - 89 edges
3. `getActor()` - 70 edges
4. `notFound()` - 62 edges
5. `runAction()` - 53 edges
6. `invalid()` - 51 edges
7. `db` - 48 edges
8. `actorCan()` - 43 edges
9. `parse()` - 40 edges
10. `next` - 39 edges

## Surprising Connections (you probably didn't know these)
- `org()` --calls--> `loadActor()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/authz/context.ts
- `main()` --calls--> `acceptQuote()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts
- `main()` --calls--> `cancelBooking()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts
- `main()` --calls--> `completeTrip()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts
- `main()` --calls--> `createTransferRequest()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts

## Import Cycles
- 2-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/notifications.ts`
- 3-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/services/booking-extras.ts -> src/server/notifications.ts`

## Communities (36 total, 4 thin omitted)

### Community 0 - "demo-boerse.ts"
Cohesion: 0.15
Nodes (20): at(), driver(), liveFleetDemo(), main(), org(), trail(), db, main() (+12 more)

### Community 1 - "notFound"
Cohesion: 0.16
Nodes (12): nextConfig, next, LoginPage(), ForgotPasswordPage(), ResetPasswordPage(), AuthLayout(), Labels, ThemeToggle() (+4 more)

### Community 2 - "LiveMap.tsx"
Cohesion: 0.12
Nodes (21): leaflet@^1.9.4, leaflet, ago(), AUSTRIA, Basemap, duration(), esc(), headingOf() (+13 more)

### Community 3 - "marketplace.ts"
Cohesion: 0.06
Nodes (106): bookingTransitionAction(), dynamic, GET, POST, run(), HANDOFF_SHARE_OPTIONS, HandoffSplit, MAX_HANDOFF_SHARE_PERCENT (+98 more)

### Community 4 - "actions.ts"
Cohesion: 0.07
Nodes (82): acceptInvitationAction(), acceptQuoteAction(), addPartnerAction(), adminReviewCapabilityAction(), adminReviewDocumentAction(), adminSetOrgPlanAction(), adminSetOrgStatusAction(), advanceAudienceAction() (+74 more)

### Community 5 - "getI18n"
Cohesion: 0.06
Nodes (126): AdminOrgPage(), AdminPage(), PlanCell(), STATUSES, TYPES, RequestDetailPage(), stageIndex(), STAGES (+118 more)

### Community 6 - "weitergabe.yml"
Cohesion: 0.11
Nodes (18): concurrency, cancel-in-progress, group, APP_URL, jobs, weitergabe, name, on (+10 more)

### Community 7 - "Landing.tsx"
Cohesion: 0.13
Nodes (18): @fontsource-variable/albert-sans, @fontsource-variable/imbue, react, generateMetadata(), RootLayout(), Home(), Labels, HeroClaim() (+10 more)

### Community 8 - "invalid"
Cohesion: 0.20
Nodes (19): requirePlatformAdmin(), adminGetOrganization(), adminListOrganizations(), adminReviewCapability(), adminReviewDocument(), adminSetOrganizationPlan(), adminSetOrganizationStatus(), reviewSchema (+11 more)

### Community 9 - "driver.ts"
Cohesion: 0.18
Nodes (13): POST(), driverOverview(), openShift(), pointSchema, pointsSchema, POSITION_RETENTION_DAYS, POSITION_STALE_SECONDS, purgeOldPositions() (+5 more)

### Community 10 - "context.ts"
Cohesion: 0.29
Nodes (11): loadActor(), OrgActor, getOwnOrganization(), addDocument(), addMember(), createAdmin(), orgInput(), PDF (+3 more)

### Community 11 - "organizations/[id]/page.tsx"
Cohesion: 0.08
Nodes (25): GET(), EN, Locale, LOCALE_COOKIE, LOCALES, makeT(), T, translate() (+17 more)

### Community 12 - "members.ts"
Cohesion: 0.12
Nodes (26): ALL, assignableRoles(), can(), decide(), Decision, OrgAuthzInput, Permission, PERMISSION_CAPABILITY (+18 more)

### Community 13 - "createTransferRequest"
Cohesion: 0.18
Nodes (21): vitest, estimateMinutes(), createTransferRequest(), categoryFits(), findMatchesForCapacity(), listCapacityWithMatches(), matchCapacity(), MatchInput (+13 more)

### Community 14 - "Product"
Cohesion: 0.20
Nodes (9): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Purpose (+1 more)

### Community 15 - "db.ts"
Cohesion: 0.13
Nodes (18): @prisma/client, zod, db, globalForPrisma, Actor, transferInclude, TransferRow, Tx (+10 more)

### Community 16 - "members.ts"
Cohesion: 0.19
Nodes (10): Datenschutz(), metadata, Impressum(), metadata, NotFound(), metadata, Nutzungsbedingungen(), BackLink() (+2 more)

### Community 18 - "errors.ts"
Cohesion: 0.27
Nodes (11): buildScene(), DAY, drawTaxi(), layer(), NIGHT, NightRoad(), noise1(), Palette (+3 more)

### Community 19 - "validation.ts"
Cohesion: 0.15
Nodes (9): countrySchema, emailSchema, orgProfileSchema, passwordSchema, phoneSchema, postalCodeSchema, registrationSchema, transportProfileSchema (+1 more)

### Community 20 - "ShiftTracker.tsx"
Cohesion: 0.38
Nodes (6): Fix, ShiftTracker(), flush(), keepAwake(), onVisible(), TrackerText

### Community 21 - "Pricing.tsx"
Cohesion: 0.24
Nodes (7): generateMetadata(), PreisePage(), Pricing(), SiteFooter(), T, Logo(), PLANS

### Community 22 - "server/push.ts"
Cohesion: 0.25
Nodes (8): web-push@^4.0.0, web-push, appUrl(), BUSINESS_ROLES, configure(), OrgPush, PushMessage, sentPushes

### Community 23 - "context.ts"
Cohesion: 0.40
Nodes (3): currentHref(), NavItem, ShellNav()

### Community 24 - "PushToggle.tsx"
Cohesion: 0.36
Nodes (6): keyBytes(), PushText, PushToggle(), enable(), save(), State

### Community 26 - "Transferborsa"
Cohesion: 0.06
Nodes (33): Berechtigungsmodell, Datenmodelle, Gewählte Architektur, Implementierungsplan, Live-Flottenkarte und Fahrer, Offene Fragen (Annahmen getroffen, reversibel), Phase 1: Ist-Zustand (26.10.2026), Phase 4: Reisebüros (Szenario B) (+25 more)

### Community 27 - "audit"
Cohesion: 0.18
Nodes (19): derive(), verifyPassword(), createSession(), invalidateAllSessions(), invalidateSession(), SESSION_TTL_MS, validateSessionToken(), generateToken() (+11 more)

### Community 30 - "dispatch.ts"
Cohesion: 0.21
Nodes (15): BY_ID, getPlace(), haversineKm(), isPlaceId(), nearestPlace(), Place, Point, ROAD_FACTOR (+7 more)

### Community 35 - "test"
Cohesion: 0.08
Nodes (25): DATABASE_URL, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, jobs, test, name, on (+17 more)

### Community 38 - "package.json"
Cohesion: 0.10
Nodes (26): description, devDependencies, dotenv-cli@^11.0.0, prisma@^6.19.3, tsx@^4.23.15, @types/leaflet@^1.9.22, @types/node@^22.20.5, @types/react@^19.3.0 (+18 more)

### Community 53 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 62 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @fontsource-variable/albert-sans@^5.3.0, @fontsource-variable/imbue@^5.3.0, maplibre-gl@^4.7.1, @maplibre/maplibre-gl-leaflet@^0.0.22, next@^15.5.28, pdf-lib@^1.17.1, @prisma/client@^6.19.3 (+9 more)

### Community 76 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:demo, db:deploy, db:migrate, db:seed, dev, lint (+5 more)

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `notFound` to `marketplace.ts`, `actions.ts`, `getI18n`, `package.json`, `Landing.tsx`, `organizations/[id]/page.tsx`, `members.ts`, `ShiftTracker.tsx`, `Pricing.tsx`, `context.ts`, `dependencies`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Should `LiveMap.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12307692307692308 - nodes in this community are weakly interconnected._
- **Why does `getI18n` connect `getI18n` to `notFound`, `actions.ts`, `Landing.tsx`, `organizations/[id]/page.tsx`, `members.ts`, `Pricing.tsx`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `marketplace.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05569007263922518 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Landing.tsx` to `notFound`, `LiveMap.tsx`, `getI18n`, `package.json`, `errors.ts`, `ShiftTracker.tsx`, `Pricing.tsx`, `context.ts`, `PushToggle.tsx`, `dependencies`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0692785475394171 - nodes in this community are weakly interconnected._
- **Should `getI18n` be split into smaller, more focused modules?**
  _Cohesion score 0.0565875472996216 - nodes in this community are weakly interconnected._