# Graph Report - taxi_route-hero  (2026-11-10)

## Corpus Check
- 140 files · ~77,296 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .css 4, (none) 3, .example 1)

## Summary
- 911 nodes · 3450 edges · 41 communities (33 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1229ad4d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 20261026102414_phase3_marketplace/migration.sql
- web.ts
- LiveMap.tsx
- marketplace.ts
- actions.ts
- organization/page.tsx
- Landing.tsx
- invalid
- organizations/[id]/page.tsx
- server/i18n.ts
- boerse/page.tsx
- Product
- db.ts
- members.ts
- vercel.json
- context.ts
- requirePermission
- LegalPage
- notFound
- context.ts
- db.ts
- takeFixedPriceRequest
- messages.ts
- Transferborsa
- validation.ts
- layout.tsx
- ShellNav.tsx
- dispatch.ts
- Startseite (/)
- ClaimOrder.tsx
- test
- package.json
- compilerOptions
- dependencies
- scripts
- fahrer/page.tsx
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
- `main()` --calls--> `hashPassword()`  [EXTRACTED]
  prisma/seed.ts → src/server/auth/password.ts
- `at()` --calls--> `fromLocalInput()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/lib/format.ts
- `main()` --calls--> `acceptQuote()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts
- `main()` --calls--> `submitQuote()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts
- `liveFleetDemo()` --calls--> `createTransferRequest()`  [EXTRACTED]
  prisma/demo-boerse.ts → src/server/services/marketplace.ts

## Import Cycles
- 2-file cycle: `src/server/notifications.ts -> src/server/services/marketplace.ts -> src/server/notifications.ts`

## Communities (41 total, 8 thin omitted)

### Community 0 - "20261026102414_phase3_marketplace/migration.sql"
Cohesion: 0.05
Nodes (63): "AuditEvent", AuditEvent_organizationId_createdAt_idx, "Invitation", Invitation_organizationId_idx, Invitation_tokenHash_key, "Membership", Membership_organizationId_idx, Membership_userId_organizationId_key (+55 more)

### Community 1 - "web.ts"
Cohesion: 0.13
Nodes (30): @prisma/client, AdminOrgPage(), AdminPage(), PlanCell(), STATUSES, TYPES, fmtDate(), fromLocalInput() (+22 more)

### Community 2 - "LiveMap.tsx"
Cohesion: 0.14
Nodes (19): leaflet@^1.9.4, leaflet, ago(), AUSTRIA, Basemap, duration(), esc(), headingOf() (+11 more)

### Community 3 - "marketplace.ts"
Cohesion: 0.11
Nodes (16): HANDOFF_SHARE_OPTIONS, HandoffSplit, MAX_HANDOFF_SHARE_PERCENT, BoardFilter, boardFilterSchema, BOOKING_TO_REQUEST, MarketRequest, marketSelect (+8 more)

### Community 4 - "actions.ts"
Cohesion: 0.12
Nodes (57): acceptInvitationAction(), acceptQuoteAction(), addPartnerAction(), adminReviewCapabilityAction(), adminReviewDocumentAction(), adminSetOrgPlanAction(), adminSetOrgStatusAction(), advanceAudienceAction() (+49 more)

### Community 5 - "organization/page.tsx"
Cohesion: 0.13
Nodes (40): RequestDetailPage(), stageIndex(), NewRequestPage(), LiveFleetPage(), FleetPage(), DocumentsPage(), MembersPage(), ROLE_HELP (+32 more)

### Community 7 - "Landing.tsx"
Cohesion: 0.16
Nodes (13): react, Home(), Crossfade(), Img, HeroClaim(), Labels, ChatScene(), Confirmation() (+5 more)

### Community 8 - "invalid"
Cohesion: 0.11
Nodes (46): at(), liveFleetDemo(), main(), trail(), bookingTransitionAction(), requirePermission(), invalid(), audit() (+38 more)

### Community 11 - "organizations/[id]/page.tsx"
Cohesion: 0.06
Nodes (48): GET(), cache, df(), fmtDateTime(), fmtTime(), tag(), EN, Locale (+40 more)

### Community 12 - "server/i18n.ts"
Cohesion: 0.15
Nodes (20): nextConfig, next, InvitePage(), LoginPage(), NoOrg(), NotFound(), ForgotPasswordPage(), ResetPasswordPage() (+12 more)

### Community 13 - "boerse/page.tsx"
Cohesion: 0.14
Nodes (37): BoersePage(), BookingsView(), CapacityMarketView(), CHIP_HIDDEN, FILTER_KEYS, GROUPS, InvitationsView(), MarketView() (+29 more)

### Community 14 - "Product"
Cohesion: 0.20
Nodes (9): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Purpose (+1 more)

### Community 15 - "db.ts"
Cohesion: 0.18
Nodes (20): derive(), verifyPassword(), createSession(), invalidateAllSessions(), invalidateSession(), SESSION_COOKIE, SESSION_TTL_MS, validateSessionToken() (+12 more)

### Community 16 - "members.ts"
Cohesion: 0.29
Nodes (15): assignableRoles(), forbidden(), acceptInvitation(), changeMemberRole(), consumeInvitation(), ensureNotLastOwner(), findOpenInvitation(), getInvitationPreview() (+7 more)

### Community 18 - "context.ts"
Cohesion: 0.12
Nodes (25): zod, logoutAction(), switchOrgAction(), GET(), GET(), POST(), Actor, OrgActor (+17 more)

### Community 19 - "requirePermission"
Cohesion: 0.19
Nodes (18): dynamic, GET(), splitHandoff(), conflict(), acceptQuote(), ownVehicleId(), scopeSnapshot(), addPartner() (+10 more)

### Community 20 - "LegalPage"
Cohesion: 0.27
Nodes (7): Datenschutz(), metadata, Impressum(), metadata, metadata, Nutzungsbedingungen(), LegalPage()

### Community 21 - "notFound"
Cohesion: 0.27
Nodes (12): notFound(), notificationFailed(), returnBooking(), getBookingConfirmation(), orgSelect, cancelTransferRequest(), checkInvitees(), inviteProviders() (+4 more)

### Community 22 - "context.ts"
Cohesion: 0.21
Nodes (16): driver(), org(), db, main(), hashPassword(), loadActor(), adminReviewDocument(), registerOrganization() (+8 more)

### Community 23 - "db.ts"
Cohesion: 0.17
Nodes (13): db, globalForPrisma, estimateMinutes(), Tx, categoryFits(), findMatchesForCapacity(), matchCapacity(), MatchInput (+5 more)

### Community 24 - "takeFixedPriceRequest"
Cohesion: 0.31
Nodes (15): vitest, createTransferRequest(), getTransferRequest(), markInvitationResponded(), OPEN_FOR_MARKET(), requireMarketAccess(), searchBoard(), submitQuote() (+7 more)

### Community 25 - "messages.ts"
Cohesion: 0.39
Nodes (7): access(), alertSchema, canWrite(), listThreads(), MAX_MESSAGE_LENGTH, sendMessage(), VISIBLE_TO()

### Community 26 - "Transferborsa"
Cohesion: 0.07
Nodes (27): Berechtigungsmodell, Datenmodelle, Gewählte Architektur, Implementierungsplan, Live-Flottenkarte und Fahrer, Offene Fragen (Annahmen getroffen, reversibel), Phase 1: Ist-Zustand (26.10.2026), Phase 4: Reisebüros (Szenario B) (+19 more)

### Community 27 - "validation.ts"
Cohesion: 0.17
Nodes (9): DEFAULT_CAPABILITIES, countrySchema, emailSchema, memberRoleSchema, orgProfileSchema, passwordSchema, registrationSchema, transportProfileSchema (+1 more)

### Community 28 - "layout.tsx"
Cohesion: 0.25
Nodes (6): @fontsource-variable/albert-sans@^5.3.0, @fontsource-variable/imbue@^5.3.0, @fontsource-variable/albert-sans, @fontsource-variable/imbue, generateMetadata(), RootLayout()

### Community 29 - "ShellNav.tsx"
Cohesion: 0.40
Nodes (3): currentHref(), NavItem, ShellNav()

### Community 30 - "dispatch.ts"
Cohesion: 0.08
Nodes (31): GET(), BY_ID, getPlace(), haversineKm(), isPlaceId(), nearestPlace(), Place, PLACES (+23 more)

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
Cohesion: 0.13
Nodes (15): dependencies, maplibre-gl@^4.7.1, @maplibre/maplibre-gl-leaflet@^0.0.22, next@^15.5.28, pdf-lib@^1.17.1, @prisma/client@^6.19.3, react@^19.1.1, react-dom@^19.1.1 (+7 more)

### Community 76 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, db:demo, db:deploy, db:migrate, db:seed, dev, lint (+5 more)

### Community 123 - "fahrer/page.tsx"
Cohesion: 0.21
Nodes (12): DriverPage(), metadata, navUrl(), NEXT_STEP, Fix, ShiftTracker(), flush(), keepAwake() (+4 more)

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `server/i18n.ts` to `web.ts`, `actions.ts`, `organization/page.tsx`, `package.json`, `Landing.tsx`, `organizations/[id]/page.tsx`, `boerse/page.tsx`, `context.ts`, `requirePermission`, `fahrer/page.tsx`, `layout.tsx`, `ShellNav.tsx`, `dependencies`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `20261026102414_phase3_marketplace/migration.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.0528169014084507 - nodes in this community are weakly interconnected._
- **Why does `getI18n` connect `server/i18n.ts` to `web.ts`, `actions.ts`, `organization/page.tsx`, `Landing.tsx`, `organizations/[id]/page.tsx`, `boerse/page.tsx`, `context.ts`, `LegalPage`, `fahrer/page.tsx`, `layout.tsx`, `dispatch.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `web.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1349206349206349 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `web.ts` to `marketplace.ts`, `actions.ts`, `organization/page.tsx`, `package.json`, `invalid`, `organizations/[id]/page.tsx`, `boerse/page.tsx`, `members.ts`, `context.ts`, `requirePermission`, `dispatch.ts`, `context.ts`, `db.ts`, `messages.ts`, `validation.ts`, `dependencies`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Should `LiveMap.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13768115942028986 - nodes in this community are weakly interconnected._
- **Should `marketplace.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._