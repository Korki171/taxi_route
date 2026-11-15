# Graph Report - taxi_route-hero  (2026-11-15)

## Corpus Check
- 149 files · ~83,759 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .css 5, (none) 3, .example 1)

## Summary
- 964 nodes · 3632 edges · 36 communities (28 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `967b053c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 20261026102414_phase3_marketplace/migration.sql
- next
- LiveMap.tsx
- marketplace.ts
- actions.ts
- getI18n
- Landing.tsx
- parse
- organizations/[id]/page.tsx
- members.ts
- helpers.ts
- Product
- context.ts
- server/i18n.ts
- vercel.json
- NightRoad.tsx
- validation.ts
- ShiftTracker
- Pricing.tsx
- register/page.tsx
- ShellNav.tsx
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
1. `requirePermission()` - 89 edges
2. `getI18n` - 84 edges
3. `getActor()` - 64 edges
4. `notFound()` - 60 edges
5. `runAction()` - 52 edges
6. `invalid()` - 49 edges
7. `db` - 44 edges
8. `actorCan()` - 41 edges
9. `next` - 39 edges
10. `parse()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `at()` --calls--> `fromLocalInput()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/lib/format.ts
- `main()` --calls--> `createVehicle()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/fleet.ts
- `driver()` --calls--> `hashPassword()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/auth/password.ts
- `driver()` --calls--> `loadActor()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/authz/context.ts
- `booked()` --calls--> `createTransferRequest()`  [EXTRACTED]
  tests/booking-extras.test.ts → src/server/services/marketplace.ts

## Import Cycles
- 2-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/notifications.ts`
- 3-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/services/booking-extras.ts -> src/server/notifications.ts`

## Communities (36 total, 8 thin omitted)

### Community 0 - "20261026102414_phase3_marketplace/migration.sql"
Cohesion: 0.05
Nodes (63): "AuditEvent", AuditEvent_organizationId_createdAt_idx, "Invitation", Invitation_organizationId_idx, Invitation_tokenHash_key, "Membership", Membership_organizationId_idx, Membership_userId_organizationId_key (+55 more)

### Community 1 - "next"
Cohesion: 0.14
Nodes (14): nextConfig, next, dynamic, GET(), InvitePage(), LoginPage(), ForgotPasswordPage(), ResetPasswordPage() (+6 more)

### Community 2 - "LiveMap.tsx"
Cohesion: 0.13
Nodes (19): ago(), AUSTRIA, Basemap, duration(), esc(), headingOf(), legLabels(), legRoles() (+11 more)

### Community 3 - "marketplace.ts"
Cohesion: 0.05
Nodes (115): at(), driver(), liveFleetDemo(), main(), trail(), bookingTransitionAction(), GET(), POST() (+107 more)

### Community 4 - "actions.ts"
Cohesion: 0.09
Nodes (70): acceptInvitationAction(), acceptQuoteAction(), addPartnerAction(), adminReviewCapabilityAction(), adminReviewDocumentAction(), adminSetOrgPlanAction(), adminSetOrgStatusAction(), advanceAudienceAction() (+62 more)

### Community 5 - "getI18n"
Cohesion: 0.06
Nodes (115): AdminOrgPage(), AdminPage(), PlanCell(), STATUSES, TYPES, RequestDetailPage(), stageIndex(), STAGES (+107 more)

### Community 7 - "Landing.tsx"
Cohesion: 0.10
Nodes (20): @fontsource-variable/albert-sans, @fontsource-variable/imbue, react, generateMetadata(), RootLayout(), Home(), Labels, HeroClaim() (+12 more)

### Community 8 - "parse"
Cohesion: 0.15
Nodes (27): @prisma/client, requirePlatformAdmin(), adminGetOrganization(), adminListOrganizations(), adminReviewCapability(), adminReviewDocument(), adminSetOrganizationPlan(), adminSetOrganizationStatus() (+19 more)

### Community 11 - "organizations/[id]/page.tsx"
Cohesion: 0.06
Nodes (47): GET(), EN, Locale, LOCALE_COOKIE, LOCALES, makeT(), pickLocale(), T (+39 more)

### Community 12 - "members.ts"
Cohesion: 0.29
Nodes (14): assignableRoles(), acceptInvitation(), changeMemberRole(), consumeInvitation(), ensureNotLastOwner(), findOpenInvitation(), getInvitationPreview(), INVITATION_TTL_MS (+6 more)

### Community 13 - "helpers.ts"
Cohesion: 0.22
Nodes (19): org(), loadActor(), createVehicle(), registerOrganization(), booked(), setup(), addMember(), inHours() (+11 more)

### Community 14 - "Product"
Cohesion: 0.20
Nodes (9): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Purpose (+1 more)

### Community 15 - "context.ts"
Cohesion: 0.16
Nodes (15): vitest, db, globalForPrisma, Actor, agencyOverview(), transferInclude, TransferRow, transferState() (+7 more)

### Community 16 - "server/i18n.ts"
Cohesion: 0.19
Nodes (10): Datenschutz(), metadata, Impressum(), metadata, NotFound(), metadata, Nutzungsbedingungen(), BackLink() (+2 more)

### Community 18 - "NightRoad.tsx"
Cohesion: 0.27
Nodes (11): buildScene(), DAY, drawTaxi(), layer(), NIGHT, NightRoad(), noise1(), Palette (+3 more)

### Community 19 - "validation.ts"
Cohesion: 0.13
Nodes (11): DEFAULT_CAPABILITIES, countrySchema, memberRoleSchema, orgProfileSchema, passwordSchema, phoneSchema, postalCodeSchema, registrationSchema (+3 more)

### Community 20 - "ShiftTracker"
Cohesion: 0.83
Nodes (4): ShiftTracker(), flush(), keepAwake(), onVisible()

### Community 21 - "Pricing.tsx"
Cohesion: 0.35
Nodes (6): generateMetadata(), PreisePage(), Pricing(), SiteFooter(), T, Logo()

### Community 22 - "register/page.tsx"
Cohesion: 0.62
Nodes (4): RegisterPage(), Org, OrgProfileFields(), Req()

### Community 23 - "ShellNav.tsx"
Cohesion: 0.40
Nodes (3): currentHref(), NavItem, ShellNav()

### Community 26 - "Transferborsa"
Cohesion: 0.07
Nodes (27): Berechtigungsmodell, Datenmodelle, Gewählte Architektur, Implementierungsplan, Live-Flottenkarte und Fahrer, Offene Fragen (Annahmen getroffen, reversibel), Phase 1: Ist-Zustand (26.10.2026), Phase 4: Reisebüros (Szenario B) (+19 more)

### Community 27 - "audit"
Cohesion: 0.17
Nodes (22): db, main(), zod, derive(), hashPassword(), verifyPassword(), createSession(), invalidateAllSessions() (+14 more)

### Community 30 - "dispatch.ts"
Cohesion: 0.10
Nodes (28): GET(), BY_ID, getPlace(), haversineKm(), isPlaceId(), nearestPlace(), Place, PLACES (+20 more)

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
Cohesion: 0.11
Nodes (19): dependencies, @fontsource-variable/albert-sans@^5.3.0, @fontsource-variable/imbue@^5.3.0, leaflet@^1.9.4, maplibre-gl@^4.7.1, @maplibre/maplibre-gl-leaflet@^0.0.22, next@^15.5.28, pdf-lib@^1.17.1 (+11 more)

### Community 76 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:demo, db:deploy, db:migrate, db:seed, dev, lint (+5 more)

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `actions.ts`, `getI18n`, `package.json`, `Landing.tsx`, `organizations/[id]/page.tsx`, `server/i18n.ts`, `Pricing.tsx`, `register/page.tsx`, `ShellNav.tsx`, `dependencies`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `20261026102414_phase3_marketplace/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.0528169014084507 - nodes in this community are weakly interconnected._
- **Why does `getI18n` connect `getI18n` to `next`, `Landing.tsx`, `organizations/[id]/page.tsx`, `server/i18n.ts`, `Pricing.tsx`, `register/page.tsx`, `dispatch.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.13538461538461538 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Landing.tsx` to `next`, `LiveMap.tsx`, `getI18n`, `package.json`, `server/i18n.ts`, `NightRoad.tsx`, `Pricing.tsx`, `ShellNav.tsx`, `dependencies`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Should `LiveMap.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13405797101449277 - nodes in this community are weakly interconnected._
- **Should `marketplace.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05012531328320802 - nodes in this community are weakly interconnected._