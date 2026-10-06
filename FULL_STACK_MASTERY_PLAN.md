# Webanly ko khud build karke Full-Stack Mastery tak pahunchne ka plan

## Is document ka use kaise karna hai

Pichhle version mein topics kaafi the, par repo khol kar exact kaam karne ke
steps kam the. Yeh version ek practical workbook hai. Isme har bade step ke
saath bataya hai:

- Kaunsi file kholni hai.
- Pehle current behavior kaise dekhna hai.
- Tumhe khud kaunsa chhota experiment, test ya code change karna hai.
- Change ko kaise verify karna hai.
- Kaunsi cheez code ke bahar likhni, decide karni ya operate karni hai.

Target yeh nahi ki bas code copy karke 100 issues “fix” kar do. Target yeh hai
ki tum har feature ke liye jawab de sako: user kya kar raha hai, data kahan jaata
hai, kis layer par decision hota hai, failure par kya hota hai, aur tumhare
change ka proof kya hai.

Yeh plan in teeno guides ke saath use karo:

- [Code-level project questions](./INTERVIEW_QUESTIONS.md)
- [Project questions ke Hinglish answers](./INTERVIEW_ANSWERS_HINGLISH.md)
- [apps/web ke Hinglish Q&A](./APPS_WEB_INTERVIEW_HINGLISH.md)

**Important:** Interview answers ko final truth mat samjho. Har claim ko
current code, framework version, database behavior aur local reproduction se
verify karo. Pehle test/reproduction, phir change.

## Tumhare repo ka quick map

| Kahan | Is project mein iska kaam |
|---|---|
| `apps/web/app/` | Next.js App Router pages, layouts aur HTTP Route Handlers |
| `apps/web/hooks/` | React/TanStack Query hooks, domain actions, realtime clients |
| `apps/web/lib/Actions/` | Server Actions: session ke saath domain/payment operations |
| `apps/web/lib/shared/DBfunctions/` | Analytics API ke DB queries, validation aur cache helpers |
| `apps/web/store/` | Dashboard filters/theme jaise client-side Redux state |
| `apps/web/components/` | Product UI; app-specific widgets aur wrappers |
| `apps/web/public/script.js` | Customer ki website par chalne wala tracker |
| `apps/server/src/modules/collector/` | Collector HTTP API, event validation/enrichment/publish |
| `apps/server/src/modules/eventDumping/` | Kafka se historical events DB mein likhna |
| `apps/server/src/modules/websocket/` | Live events, socket lifecycle aur visitor sets |
| `apps/server/src/modules/spkies/` | Traffic spikes detect karna aur notification publish |
| `apps/server/src/modules/notifications/` | Notification Kafka worker |
| `apps/server/src/modules/domainLifeCycle/` | Expiry/warning lifecycle jobs |
| `packages/db/prisma/` | Prisma model aur DB migration history |
| `packages/redis/` | Shared Redis connection/helpers |
| `packages/ui/` | Shared Tailwind tokens, shadcn-style components aur charts |
| `docker-compose.yml` | Local infra/apps ko chalane ki wiring |
| `turbo.json`, root `package.json` | Workspace scripts, dependency ordering, build tasks |

## Kaam karne ka rule

Har exercise is exact cycle mein karo:

1. **File kholo:** jis file ka naam diya hai use khud padho.
2. **Caller dhoondo:** function kahan call hota hai? Uska output kaun use karta
   hai? Ek caller aur ek consumer bhi padho.
3. **Current behavior likho:** valid case aur ek failure case apne shabdon mein
   note karo. Abhi code edit nahi.
4. **Reproduce/test karo:** browser, local services, unit test, ya temporary
   fixture se behavior prove karo.
5. **Chhota change karo:** ek behavior ek branch mein improve karo. Unrelated
   cleanup saath mat milao.
6. **Verify karo:** focused test, `typecheck`, zaroorat par lint/build aur
   manual browser check.
7. **Explain karo:** “pehle kya hota tha, ab kya hota hai, kaise prove kiya,
   aur kya abhi bhi risk hai?”

Har exercise ke notes apne private learning log mein rakho. `.env`, cookies,
API keys, raw IPs ya real customer analytics ko notes/screenshots mein mat
rakho.

## Start karne se pehle: safe setup

### Step 0.1 — Worktree aur scripts samjho

**Kholna:** root `package.json`, `turbo.json`, `apps/web/package.json`,
`apps/server/package.json`, `packages/db/package.json`.

**Karna:**

- `git status --short` chalao. Jo existing changes hain unko note karo; apne
  learning ke liye alag branch banao.
- Root scripts likho: `dev`, `lint`, `format`, `typecheck`, `build`.
- Web scripts likho: `dev`, `build`, `start`, `lint`, `format`, `typecheck`.
- Server aur DB ke scripts bhi note karo. Web package mein test script nahi
  dikhe toh current repo mein test availability separately verify karo.
- `turbo.json` se samjho `build` ke pehle `^build` kyun hai aur build outputs
  cache mein kaise jaate hain.

**Kyun:** Monorepo mein `npm run build` ek app ki build nahi hoti. Agar DB
package pehle generate/build hota hai, to dependency order todne par confusing
TypeScript/module error mil sakta hai.

**Proof:** Tum bata sakte ho `apps/web` ka typecheck, server build, Prisma
generate aur root build ka exact command kya hai. Har focused command chalane
se pehle package script confirm karo; command names guess mat karo.

### Step 0.2 — Local app chalao, bina data delete kiye

**Kholna:** `README.md`, `docker-compose.yml`, `apps/web/next.config.mjs`,
`apps/web/postcss.config.mjs`, `apps/server/src/index.ts`.

**Karna:**

- README ki local setup instructions follow karo; required environment values
  ki checklist banao. Secret values kisi ko paste/share mat karo.
- Local stack start karo aur browser mein sign-in/public page dekho.
- Docker containers ke logs/health inspect karo; web, server, Postgres, Redis,
  Kafka ko naam se identify karo.
- Collector request ke baad web browser Network tab, server logs, Kafka
  consumer output aur DB row ko inspect karne ka tareeqa note karo.
- Agar setup fail hota hai, exact error, failing service aur missing
  dependency likho. Pehle diagnose karo; stack ko blindly reconfigure mat karo.
- Cleanup ke waqt `docker compose down` aur `docker compose down -v` ka
  farq samjho. `-v` persistent local DB/Redis data mita sakta hai; jab tak
  deliberate reset nahi chahiye tab tak use mat karo.

**Proof:** Tum local app start/stop kar sakte ho aur kisi failure ko “web
problem” kehne ke bajaye exact service/config tak narrow kar sakte ho.

### Step 0.3 — Teen diagrams banao

Code change nahi. Paper/draw.io/mermaid mein:

1. **Component diagram:** browser tracker, collector, Kafka, DB worker,
   PostgreSQL, Redis, WebSocket server, Next.js, browser dashboard, auth,
   payment, AI.
2. **Event sequence:** tracker event se collector, Kafka, DB, WebSocket,
   Query cache aur chart tak ek view ka flow.
3. **Login/domain sequence:** GitHub sign-in, session, add domain, domain
   selection, analytics route authorization.

Har arrow par likho: HTTP/WebSocket/Kafka/DB call hai? Kaunsa ID/data pass
hota hai? Request synchronous hai ya async?

**Proof:** `collector.service.ts` ya `requireActiveDomainAccess.ts` ka naam
sun kar diagram mein uski jagah dikha sakte ho.

## Milestone 1 — Browser se dashboard tak ek event trace karo

**Samay:** 1–2 hafte. **Priority:** P0. Iske bina baaki code isolated
snippets jaisa lagega.

### Exercise 1.1 — Tracker kya bhejta hai?

**Kholna:** `apps/web/public/script.js`.

**Karna:**

- Script ka initialization dhoondo: domain/key/API URL kahan se milte hain?
- Page load par event object banta kahan hai? Har property ki list banao.
- SPA navigation detect karne wale functions dhoondo. `pushState`,
  `popstate`, pagehide, visibility event ka actual behavior likho.
- `previousPage`, `referrer`, `exitType`, `visitedAt`, `timeSpent` ki
  life-cycle trace karo.
- `sendBeacon` aur fetch fallback dono ka payload/response behavior dekho.
- Script ko apne local test page par chalao. Page reload, internal link,
  direct URL open, tab hide aur tab close try karo. DevTools Network mein
  request body aur status dekho.

**Likho:** Ek event field table: field, browser source, example, nullable?,
PII/sensitive?, server consumer.

**Proof:** Tum bata sako ki internal SPA navigation external referrer kyun
nahi hota aur browser unload par request ka response kyun uncertain ho sakta
hai.

### Exercise 1.2 — Collector event ko accept karta hai?

**Kholna:**

- `apps/server/src/modules/collector/collector.route.ts`
- `apps/server/src/modules/collector/collector.service.ts`
- `apps/server/src/modules/collector/functions/checkOrigin.ts`
- `apps/server/src/modules/collector/functions/collectorRateLimiter.ts`
- `apps/server/src/shared/functions/apikeyChecker.ts`

**Karna:**

- `/collect` request ka sequence likho: required fields → API key/domain →
  active check → rate limit → origin → enrichment → Kafka.
- Har early return/throw ka result likho: route status, body, Kafka send hua?
- `collector.route.ts` ka missing apikey/page check dekho; phir test request
  bhejo: no body, wrong type, unknown key, valid key, inactive domain, origin
  absent, origin mismatch, rate limited.
- Same event ke valid fields mein ek-ek wrong type bhejo: `page` object,
  `timeSpent` string/negative, impossible date, very long title. Current
  response observe karo; test environment safe rakho.
- `parseExitType`, `parsePreviousPage`, `normalizePath`, `parseTime`,
  `parseDate`, `extractReferrerHostname` ki implementations padho. Caller ka
  trust boundary samjho.

**Code exercise:** Chhote, bounded request schema/validator ka design karo.
Pehle tests likho. Request body size bhi bound honi chahiye. Invalid input ko
silently default karne aur valid direct visit ko represent karne mein farq
rakho.

**Proof:** Ek table ho: input case → expected HTTP status → Kafka message yes/no
→ expected log/metric. Route status “success” ka matlab sach mein accepted
event ho.

### Exercise 1.3 — Event Kafka se DB mein jaata hai?

**Kholna:**

- `apps/server/src/shared/config/kafka.ts`
- `apps/server/src/shared/config/kafka/kafkaClient.ts`
- `apps/server/src/modules/eventDumping/dumping.worker.ts`
- `apps/server/src/modules/eventDumping/functions/dumpInDB.ts`
- `packages/db/prisma/schema.prisma`

**Karna:**

- `SITE_EVENTS` topic ka naam, producer key aur consumer group note karo.
- JSON event mein kaunse fields DB model mein map hote hain? Null/default
  transformations likho.
- `dumpInDB` ka catch dekho: DB create fail hua toh error caller ko dikh raha
  hai ya sirf log hota hai? Worker caller tak follow karo.
- Valid event bhejo aur DB row verify karo. Duplicate same event bhejne par
  rows kya hoti hain? Stable `eventId` abhi hai ya nahi, confirm karo.
- Invalid JSON ya missing required `visitorId` ko test environment mein
  inject karne ka safe tareeqa dhoondo; worker offset behavior observe karo.

**Code exercise:** Pehle isolated unit test likho jo Prisma create rejection
par `dumpInDB` reject hona assert kare. Uske baad hi error propagation policy
change karo. Kafka offset commit semantics ko config/library docs aur runtime
test se verify karo.

**Kyun:** Log karna aur event ko successfully persist karna alag cheezein hain.
Consumer error swallow kare toh Kafka message processed samajh sakta hai.

**Proof:** Tum batao DB outage ke baad event retry hoga, rukega ya kho jayega,
aur kis evidence se yeh claim kar rahe ho.

### Exercise 1.4 — Historical event dashboard par kaise dikhta hai?

**Kholna:** `apps/web/app/api/analytics/timeseries/route.ts`,
`apps/web/lib/shared/DBfunctions/fetchTimeseriesData.ts`,
`apps/web/hooks/analytics/useTimeseries.ts`,
`apps/web/components/dashCards/timeseriesCard.tsx`,
`apps/web/app/(home)/dashboard/page.tsx`.

**Karna:**

- Route query params parse karta hai, auth/access check kahan hota hai, dates
  kahan validate hoti hain—sequence likho.
- Fetcher SQL aur response type padho; `visitedAt`, timezone, interval aur
  `COUNT(DISTINCT visitorId)` ki semantics note karo.
- React Query key ko request URL params se compare karo. Koi output input key
  se missing toh nahi?
- UI response error/loading/empty/success ko alag render karti hai ya nahi
  inspect karo.
- Browser Network response ko DB result se compare karo.

**Deliverable:** Event ka ek fully traced example: browser payload se chart
point tak, har data transformation aur cache boundary samet.

## Milestone 2 — `apps/web` ko samajhkar safe changes karo

**Samay:** 2–3 hafte. **Priority:** P0. Focus sirf frontend nahi—Next.js
server code, API routes aur Server Actions bhi isi app mein hain.

### Exercise 2.1 — Server/client boundary map

**Kholna:**

- `apps/web/app/layout.tsx`
- `apps/web/app/(home)/layout.tsx`
- `apps/web/app/(home)/dashboard/page.tsx`
- `apps/web/lib/providers/ReactqueryProvider.tsx`
- `apps/web/lib/providers/storeprovider.tsx`
- `apps/web/components/theme/theme-provider.tsx`
- `apps/web/app/api/analytics/timeseries/route.ts`

**Karna:**

- Har file ko server/client mark karo. `use client` ka boundary kahan se
  neeche tak apply hota hai, draw karo.
- Root layout mein kaunsa kaam server par ho sakta hai? Kaunsa browser API
  maangta hai?
- `ReactqueryProvider` ka `QueryClient` aur `StoreProvider` ka Redux store
  kitni baar create hote hain? Render par recreate ho rahe hain ya stable?
- `/api/analytics/timeseries` Route Handler ko dashboard component se alag
  request ki tarah trace karo.
- Loading/error UI ko route navigation aur API error ke cases mein manually
  test karo.

**Code exercise:** Ek chhota dashboard subcomponent identify karo jisme
interactivity nahi. Use server-side move karna hai ya nahi, reason likho;
sirf exercise ke liye `"use client"` remove mat karo. Agar move karte ho toh
build aur hydration behavior verify karo.

**Proof:** Tum explain kar sako ki `app/(home)/layout.tsx` redirect API access
protect kyun nahi karta.

### Exercise 2.2 — Query cache ko trace aur test karo

**Kholna:**

- `apps/web/lib/shared/tanstackFunctions/api.ts`
- `apps/web/lib/shared/tanstackFunctions/queryKeys.ts`
- `apps/web/hooks/analytics/useTimeseries.ts`
- `apps/web/hooks/analytics/useDimension.ts`
- `apps/web/hooks/domainCrud/useDomainSelection.ts`
- `apps/web/hooks/domainCrud/useDeleteDomain.ts`
- `apps/web/store/slices/dashboardSlice.ts`

**Karna:**

- Timeseries query key ko exact API params se compare karo.
- Domain list ka `staleTime`, timeseries ka `staleTime/gcTime`, query enabled
  conditions aur retry behavior note karo.
- DevTools/network se same query dobara mount karo: request hui ya cache se
  data aaya?
- Domain/date/timezone fast switch karte hue dekho kya old chart new labels ke
  saath dikh raha hai.
- Delete optimistic flow ko fail karke rollback test karo. Do deletes ko close
  time par trigger karke stale snapshot issue reproduce karne ki koshish karo.
- Logout/login flow mein previous user's Query cache clear hoti hai ya nahi
  inspect karo.

**Code exercise:** Ek missing cache-key input ya stale-label bug identify karke
reproduction test banao. Fix chhota rakho: key normalization, state indicator,
ya scoped cache. Mutation architecture ek saath rewrite mat karo.

**Proof:** Naya timezone ya domain select karne par correct query key, correct
request aur correct chart data teenon verify hon.

### Exercise 2.3 — Redux ko server state se alag rakho

**Kholna:** `apps/web/store/store.ts`,
`apps/web/store/slices/dashboardSlice.ts`,
`apps/web/store/slices/dimensionTimeseriesSlice.ts`,
`apps/web/hooks/domainCrud/useDomainSelection.ts`.

**Karna:**

- Har Redux field ka owner aur reason likho: domain selection, date range,
  interval, timezone, panel selection, theme.
- Har field ke liye poochho: kya yeh server se aayi entity/cache hai ya user
  ki current UI choice?
- Browser refresh ke baad kaunsi state persist hoti hai? URL mein honi chahiye
  kya? Current behavior verify karo, assumptions nahi.
- Domain delete, switch, inactive state par selected ID/date/timezone state
  ka behavior draw karo.

**Deliverable:** State ownership table. Agar data dono Redux aur Query mein
store ho, us duplicate ka exact need likho.

### Exercise 2.4 — Error/loading/empty states ko user task se jodo

**Kholna:** `apps/web/app/(home)/dashboard/page.tsx`,
`apps/web/app/(home)/error.tsx`, `loading.tsx`,
`apps/web/components/dashCards/analyticsCardState.tsx`.

**Karna:**

- Network slow, API 401, 403, 429, 500, no domains, inactive domain, no events
  har case manually trigger/mimic karo.
- Har state mein dekho: kya user ko next action clear hai? Retry button hai?
  Error user ko batata hai session expire hua ya data empty hai?
- Skeleton par screen reader status, chart no-data alternative aur retry
  keyboard focus inspect karo.
- Error normalization wrapper ke server error text ko inspect karo: safe and
  actionable hai ya internal detail leak karta hai?

**Code exercise:** Sabse confusing ek UI state ko improve karo. Component test
ya manual reproducible checklist add karo. Error ko empty chart mein convert
mat karo.

### Exercise 2.5 — Tailwind/shared UI pipeline samjho

**Kholna:** `apps/web/app/layout.tsx`,
`apps/web/postcss.config.mjs`,
`packages/ui/postcss.config.mjs`,
`packages/ui/src/styles/globals.css`,
`packages/ui/src/components/card.tsx`,
`packages/ui/src/lib/utils.ts`.

**Karna:**

- CSS import ka path trace karo. Tailwind v4 PostCSS plugin kahan load hota
  hai? Shared CSS `@source` kin app/component files ko scan karta hai?
- Ek existing utility class ko app page mein inspect karo aur production build
  ke CSS mein us class ka output confirm karo.
- Theme variables (`--background`, `--primary`, etc.) se `bg-background`
  token tak mapping follow karo.
- Kisi dashboard card ko teen viewport widths aur light/dark/custom theme mein
  dekho.
- Hard-coded color/spacing milne par pehle intent samjho; token change design
  decision hai, blind replace nahi.

**Proof:** Tum bata sako ki component render hone ke bawajood production CSS
missing ho sakti hai agar source glob galat ho.

## Milestone 3 — Auth aur tenant isolation prove karo

**Samay:** 1–2 hafte. **Priority:** P0. Yeh feature polish se pehle.

### Exercise 3.1 — Session login se server check tak

**Kholna:**

- `apps/web/lib/betterAuth/auth.ts`
- `apps/web/lib/betterAuth/auth-client.ts`
- `apps/web/lib/Actions/requireSession.ts`
- `apps/web/app/(home)/layout.tsx`
- `apps/web/app/api/auth/[...all]/route.ts`

**Karna:**

- OAuth config se callback/session lookup tak sequence draw karo.
- Layout `headers()` se session kaise leta hai note karo.
- Client auth helper aur server auth module ka separation samjho.
- Cookie/session browser storage ya network mein kahan dikhta hai? Secret ko
  copy nahi karna; sirf location/type note karo.
- Logged-out user dashboard navigate kare aur direct analytics API call kare:
  dono outcomes verify karo.

**Code exercise:** Session missing behavior ke liye ek focused test/manual
checklist banao. Layout redirect ko API 401 ke substitute mat banao.

### Exercise 3.2 — Cross-user domain test matrix

**Kholna:** `apps/web/lib/shared/DBfunctions/helper/requireActiveDomainAccess.ts`,
`apps/web/lib/Actions/findOwnedDomain.ts`,
saare `apps/web/app/api/analytics/*/route.ts`,
`apps/web/app/api/ai/chat/route.ts`.

**Karna:**

- Test users A/B aur domains A/B ka local-only setup banao.
- Har analytics route ko user A session + domain B ID ke saath call karne ka
  test likho. Response data mein domain B ka kuch nahi hona chahiye.
- AI route aur domain-changing Server Actions ke liye bhi same matrix banao.
- `findOwnedDomain` jaisi helper call na hone wale routes/actions search karo;
  current code path ko manually inspect karo.
- Inactive aur soft-deleted domain behavior separately test karo.

**Deliverable:** Matrix: anonymous/A owns/B owns/inactive/deleted ×
read/create/update/delete. Expected status/result likho.

### Exercise 3.3 — Domain ownership aur state machine

**Kholna:** `apps/web/lib/Actions/setDomain.ts`,
`deleteDomain.ts`, `rotateDomainApiKey.ts`, `isActiveDomain.ts`,
`getDomain.ts`; Prisma `Domain` model; server lifecycle module.

**Karna:**

- Domain create → active → expired/deactivated → paid/reactivated →
  deleted transitions draw karo.
- Har transition ka trigger (action, webhook, cron) likho.
- README ka ownership verification limitation current code se compare karo.
- Kisi user ko arbitrary hostname add karna kya allow karta hai? Abuse
  prevention aur DNS/HTTP verification ka product requirement likho.
- API-key rotate/delete par analytics access/cache/realtime subscription ka
  expected behavior specify karo.

**Code se bahar:** Domain ownership verification UX draft karo: TXT record ya
HTTP file, pending/verified state, proof expiry, domain transfer, failure
support process.

## Milestone 4 — Analytics numbers sahi samjho

**Samay:** 2 hafte. **Priority:** P0. Chart sundar ho par number galat ho toh
product par trust nahi bachta.

### Exercise 4.1 — Har analytics endpoint ki one-page trace sheet

**Kholna:** In sab route files:

- `apps/web/app/api/analytics/timeseries/route.ts`
- `dimension/route.ts`
- `dimension-timeseries/route.ts`
- `exit-pages/route.ts`
- `flow/route.ts`

Unke corresponding `apps/web/lib/shared/DBfunctions/fetch*.ts`, analytics
helpers, hooks aur cards bhi follow karo.

**Har endpoint ke liye likho:**

1. Required/optional query params.
2. Runtime validation.
3. Authentication, owner aur active-domain check.
4. DB query/aggregation aur null semantics.
5. Cache key aur TTL.
6. Response TypeScript type.
7. Hook/query key.
8. UI component jo result dikhata hai.
9. Empty/error behavior.

**Proof:** Kisi chart ke number ko API JSON, DB result aur UI label ke beech
match kar sako.

### Exercise 4.2 — Date aur timezone lab

**Kholna:** `apps/web/lib/shared/DBfunctions/helper/TimeFunctions.ts`,
`analyticsRouteUtils.ts`, `fetchTimeseriesData.ts`,
`apps/web/store/slices/dashboardSlice.ts`,
`apps/web/components/picker/timezonePicker.tsx`.

**Karna:**

- `from` aur `to` calendar dates hain ya instants? Code se answer do.
- `getAnalyticsDateBounds` ka output UTC instants ke roop mein print/test karo.
- `Asia/Kolkata`, `America/Los_Angeles`, `UTC` ke same date range par bounds
  compare karo.
- Boundary events banao: local midnight se pehle/at/baad, DST day, year end.
- Check `dayname` aur `week` outputs unique hain ya labels repeat karte hain.
- `fetchTimeseriesData` SQL bucket ko JS `Date` ke roop mein kaise use karta
  hai, exact local DB/Prisma runtime se verify karo.
- Chart format functions ko tests do; `Intl.DateTimeFormat` timezone ke saath
  DST cases cover karo.

**Code exercise:** Ek bug choose karo, e.g. invalid calendar date normalize
hona ya repeated weekday labels. Pehle test likho. API response contract
badalna pade toh web hook, type aur card ko bhi migrate karo.

**Code se bahar:** Product ke liye likho: “Today” kaunsi timezone mein hai?
Customer aur domain default alag hon toh kaun jeetega? 23/25-hour day par
report ka meaning kya hai?

### Exercise 4.3 — SQL query plans aur indexes

**Kholna:** `packages/db/prisma/schema.prisma`, migration folder, sab
`fetch*.ts` DB query files.

**Karna:**

- Har fetcher ke `WHERE`, `GROUP BY`, `ORDER BY`, `COUNT(DISTINCT)` ko
  highlight karo.
- Prisma schema ke existing indexes ko query shapes se map karo.
- Synthetic local dataset banao (small first, then larger). `EXPLAIN
  (ANALYZE, BUFFERS)` run karo; actual rows, scans, sort, buffers note karo.
- Ek possible index propose karo, write cost aur disk overhead ke saath.
- Test query speed before/after on same dataset. Tiny dataset timing ko
  production proof mat samjho.
- `week`/`dayname` correction ke liye index add karna hi first solution nahi—
  pehle semantics fix karo.

**Deliverable:** 2–3 query plan notes, index decision aur why-not alternatives.

### Exercise 4.4 — Page flow/page map ko product metric ke roop mein samjho

**Kholna:** `fetchFlowData.ts`, `fetchAllPageMapData.ts`,
`apps/web/components/dashCards/pageFlowCard.tsx`,
`pageFlowChartUtils.ts`, shared page graph component.

**Karna:**

- `previousPage`/`page` data se edge kaise banta hai trace karo.
- Missing previous page, external referrer, SPA navigation, bot/repeated event
  case ke graph par asar ka example banao.
- Top node/edge caps aur “Other” aggregation ko API result aur graph UI mein
  follow karo.
- Synthetic fixture ke known transitions ka expected edge count calculate
  karo; result compare karo.
- Graph keyboard/aria alternatives aur dense layout responsiveness test karo.

**Code se bahar:** Customer ko “user journey” bolte waqt kya assumptions hain?
Data missing ho toh graph causal path prove karta hai ya sirf observed
transition?

## Milestone 5 — Event reliability: Kafka, Redis, retries

**Samay:** 2–3 hafte. **Priority:** P0. Yeh multi-service debugging ka core
practice hai.

### Exercise 5.1 — Kafka topic map aur consumer lifecycle

**Kholna:** `apps/server/src/shared/config/kafka.ts`,
`apps/server/src/shared/config/kafka/kafkaClient.ts`,
`apps/server/src/index.ts`, teen workers ke start functions.

**Karna:**

- Topic/group/producer/consumer table banao.
- `index.ts` startup sequence aur required env check likho.
- Consumer `eachMessage` handler se DB/Redis/WebSocket effect tak follow karo.
- Har consumer ke ack/offset/retry config ko exact library version se inspect
  karo.
- Startup mein producer connect success aur ek later worker fail simulate
  karne ka test/plan likho. Kaunse connections close honge?

**Proof:** “Kafka exactly once hai” jaisa vague jawab nahi. Tum batao event
kab duplicate hoga, kab lose hoga, aur DB idempotency ka role kya hai.

### Exercise 5.2 — Poison event aur DB failure

**Kholna:** `dumping.worker.ts`, `dumpInDB.ts`.

**Karna:**

- DB insert failure ko test mein force karo.
- Assert karo consumer handler reject karta hai ya resolve.
- Invalid JSON aur schema-invalid event ka path alag define karo.
- Decide: retryable DB outage vs permanent invalid message.
- DLQ ho toh DLQ publish success se pehle original offset commit na ho.
- Replay karte waqt duplicate side effects se kaise bachaoge, write down karo.

**Code exercise:** Pehle worker boundary injection/mocking seam banao agar
direct module import se test mushkil hai. DB exception propagation par ek
regression test likho. Baad mein bounded retry/DLQ design alag task hai.

### Exercise 5.3 — Redis visitor set aur TTL

**Kholna:** `apps/server/src/modules/websocket/functions/trackVisitor.ts`,
`visitorRedisKeys.ts`, `domainseed.ts`.

**Karna:**

- Ek sample event se banne wale Redis keys likho: domain/hour/day/dimension.
- `SADD` return value `1` aur `0` ka meaning prove karo.
- TTL kis local boundary par set hota hai? DST aur timezone change par test
  cases draw karo.
- Pipeline total failure vs per-command error ka behavior alag test karo.
- Redis key inspect karo aur local test ke baad sirf apne test namespace ka
  cleanup karo.
- Seeding ke DB query result aur Redis set membership compare karo.

**Code se bahar:** Decide karo Redis data disposable cache hai ya unique visitor
metric ke liye temporary source of truth. Redis wipe hone par expected product
behavior likho.

### Exercise 5.4 — Idempotency design

**Karna pehle paper par:**

- Event ID browser generate karega, collector, ya server? Retries mein same ID
  kaise preserve hoga?
- Deduplication window kitni? DB unique constraint kya hoga?
- Socket topic duplicate receive kare toh UI duplicate count karega?
- Old tracker version event ID nahi bheje toh compatibility behavior kya?
- DB migration ka expand/backfill/contract plan kya hoga?

**Code exercise:** Sab topics/workers ek baar mein refactor mat karo. Pehle
historical persistence path mein event ID+unique DB constraint implement karne
ka test-driven vertical slice banao, phir version/backward compatibility
verify karo.

## Milestone 6 — WebSocket se live chart tak

**Samay:** 1–2 hafte. **Priority:** P1 after delivery basics.

### Exercise 6.1 — Server socket subscription trace

**Kholna:** `apps/server/src/modules/websocket/websocket.server.ts`,
`websocket.consumer.ts`, `domainLifecycle.ts`, `domainLock.ts`,
`domainseed.ts`.

**Karna:**

- Browser connect URL se `domainId`/`apikey` server authorization tak trace
  karo.
- `domainClients` ka structure aur client add/remove lifecycle likho.
- First client connect par seeding; last disconnect par 30-minute cleanup;
  reconnect during grace ka state diagram banao.
- Seed rejection, lock rejection, reconnect race aur cleanup failure reproduce
  ya test karo.
- `withDomainLock` ko 3 callers se test karo; pehla `fn()` reject ho tab bhi
  baaki execute hon aur lock entry clean ho.
- `startDomainLifecycleJob` aur WebSocket domain lifecycle ko confuse mat
  karo—dono alag jobs/concerns ho sakte hain; exact call sites dekho.

### Exercise 6.2 — Multi-instance routing ka thought experiment

**Code change se pehle:**

- Instance A par socket client connect assume karo.
- Instance B par Kafka consumer event consume kare assume karo.
- Dono process-local maps aur Kafka consumer group ko draw karo.
- Kya A ko event milta hai? Code/config se prove karo.
- Options compare karo: per-instance broadcast consumption, shared Pub/Sub,
  dedicated fanout service, sticky routing. Har option ke duplicate/loss/
  ordering/replay semantics likho.

**Code exercise:** Local integration test ya small simulation se chosen route
prove karo. Architecture badalna significant hai—pehle measured need, target
latency, infra cost aur operational ownership decide karo.

### Exercise 6.3 — Frontend live merge

**Kholna:** `apps/web/components/wrapper/RealtimeProvider.tsx`,
`hooks/realtime/useWebSocket.ts`, `useRealtimeMerge.ts`,
`useRealtimeTimeseries.ts`, `timeseriesUtils.ts`, dimension merge hooks.

**Karna:**

- Ek message ka JSON shape server consumer se frontend type tak compare karo.
- `null` novelty kis function mein false hoti hai dhoondo.
- 100ms ke andar domain/date filter switch karo; old message kahan merge hota
  hai observe/test karo.
- REST response slow rakho, beech mein WebSocket event aane do; response cache
  overwrite karta hai kya?
- Socket disconnect/reconnect ke baad historical refetch hota hai? UI
  “connected” ko “fresh” samajh rahi hai?
- Fast synthetic messages bhejo; pending buffer/memory/render behavior dekho.

**Code exercise:** Sabse chhota correctness gap choose karo—tri-state novelty,
stale key routing, ya queue bound. Regression test ke bina optimize mat karo.

## Milestone 7 — Payment flow ko end-to-end secure karo

**Samay:** 1 hafta. **Priority:** P0 for real payments.

### Exercise 7.1 — Checkout browser side

**Kholna:** `hooks/razorpayIntegration/useRazorpayCheckout.ts`,
`userRazorpayScript.ts`, `useCreateOrder.ts`,
`apps/web/lib/Actions/createOrder.ts`.

**Karna:**

- State machine draw karo: idle → script loading → creating order → checkout
  open → confirming → success/fail/unknown.
- Script load error, modal dismiss, provider failure, browser close aur poll
  timeout manually simulate karo.
- Poll timers component unmount par clear hote hain? Test/inspect.
- Timeout ko “payment failed” nahi “status unknown/pending” kaise dikhate hain?
- Frontend ko order ID, amount, public key ID milta hai; secret kabhi client
  tak nahi pahunchta—Network tab/build output se verify karo.

### Exercise 7.2 — Webhook/database side

**Kholna:** `apps/web/app/api/webhook/razorpay/route.ts`,
`apps/web/lib/Actions/createOrder.ts`, Prisma `Payment`/`Domain` models.

**Karna:**

- Raw request body signature path verify karo.
- Duplicate `payment.captured` event same order ke liye run karne ka test
  design karo.
- Do callbacks simultaneously read PENDING karte hain—barrier-controlled
  test se race prove karne ki koshish karo.
- Payment status aur domain expiry ek DB transaction mein hain? Missing domain
  par transaction commit kya hota hai?
- `createOrder` pending lookup → provider order create → DB payment create
  sequence ka failure matrix likho.
- Signature-invalid, unknown order, unknown event, DB outage response test karo.

**Code exercise:** State transition helper/conditional update ko small unit
and DB integration test se prove karo. Live provider ko test suite mein call
mat karo; signed fixtures/mocks use karo.

**Code se bahar:** Refund/chargeback/manual reconciliation aur double payment
support case ka runbook likho.

## Milestone 8 — AI feature: authorization, quota, streaming

**Samay:** 1 hafta. **Priority:** P0 spend/privacy, phir UX.

### Exercise 8.1 — Request se tool tak trace

**Kholna:** `apps/web/app/api/ai/chat/route.ts`,
`lib/ai/guards.ts`, `tokenBudget.ts`, `agent.ts`, `trimHistory.ts`, har
`lib/ai/tools/get*.ts`.

**Karna:**

- Request JSON shape, latest message, history selection aur length check trace
  karo.
- Auth → ownership → active domain → budget → classifier → agent sequence
  likho.
- Har tool ko check karo: domain ID user se aa raha hai ya authorized closure
  se? Date/interval/limit input validate hota hai?
- Stream success, model error, tool error, disconnect, timeout par actual token
  usage record hota hai ya nahi test/SDK docs se verify karo.
- Redis budget failure aur simultaneous requests ko simulate karke current
  fail-open behavior note karo.

### Exercise 8.2 — Budget aur prompt boundaries

**Paper exercise:** 40,000 tokens used hain, do requests 8,000 tokens each
check karti hain. Dono pass karengi? Total kya hoga? Atomic reservation ka
state diagram banao: reserve, actual usage, release, expire.

**Code exercise:** Budget check/increment ko ek atomic operation banane se pehle
unit test contract define karo. Reservation expiry, aborted stream, model usage
unknown, Redis unavailable cases include karo.

**Security exercise:** Prompt mein “domain badlo” ya tools ke result mein
malicious text inject karo. Prove karo prompt alone nahi, tool’s fixed domain
scope actual authorization enforce karta hai.

**Code se bahar:** Decide karo per-domain quota UTC day hai ya domain timezone
day; model provider ko kaunsi analytics fields bheji jaati hain; AI outage
par feature block hoga ya limited mode mein chalega.

## Milestone 9 — Migrations, deploy aur operate

**Samay:** 1–2 hafte. **Priority:** P0/P1.

### Exercise 9.1 — Schema/migration safe changes

**Kholna:** `packages/db/prisma/schema.prisma`, sab migration files,
`packages/db/package.json`, `docker-compose.yml`.

**Karna:**

- Schema model aur migrations ka timeline compare karo.
- Ek harmless nullable field ka practice migration local disposable DB par
  banao; production-like DB ko reset mat karo.
- Expand-and-contract sequence likho: nullable/add → compatible code →
  backfill → verify → constraint/tighten.
- Migration failure ke baad code/database state kya hogi, locally test karo.
- Generated Prisma client kab banta hai aur build dependency kahan configured
  hai verify karo.

### Exercise 9.2 — Compose aur hosted deployment compare

**Kholna:** `docker-compose.yml`, web/server Dockerfiles, `apps/server/src/index.ts`,
Kafka client config, healthcheck definitions.

**Karna:**

- Dev/Compose/hosted environment table banao: `NODE_ENV`, Kafka TLS,
  database URL, Redis URL, ports, health paths, secrets, GeoIP path.
- Healthcheck ka HTTP path actual server route ke saath compare karo.
- Server start hone se pehle producer/consumers/jobs kis order mein start
  hote hain trace karo.
- Ek dependency temporarily unavailable scenario mein startup, readiness,
  restart behavior likho.
- Logs/health se distinguish karo: process up vs ready to accept collector
  traffic.

**Code exercise:** Pehle health contract design/test karo; sirf Docker path
badal kar failing check ko hide mat karo.

### Exercise 9.3 — Observability without private data leakage

**Karna:**

- Event journey ke liye correlation/event ID ka proposal banao.
- Logs se API key, cookie, raw IP, payment signature, AI prompt, full
  referrer/path remove/ redact karne ki inventory banao.
- Metrics define karo: accepted/rejected events, Kafka lag, DB write failure,
  analytics API p95, cache hit ratio, socket event age, AI token cost, pending
  payment age.
- Metric labels bounded rakho; raw domain IDs/visitor IDs ko high-cardinality
  label mat banao.
- DB/Kafka/Redis/AI outage ke liye dashboard/alert aur first response likho.

**Code se bahar:** Har alert ke liye owner, threshold, user impact, first
diagnostic query/command, mitigation, escalation aur recovery criteria likho.

### Exercise 9.4 — Backup restore aur incident drill

**Karna:**

- Disposable local DB ka backup lo aur doosre local DB mein restore karo.
- Row counts aur key relations compare karo.
- Synthetic event backlog/lost-Redis state simulate karne ka safe plan banao.
- Incident scenario: “collector 200 de raha hai, par DB row nahi aa rahi.”
  Pehle 15 minutes mein kaunse systems/logs inspect karoge? Write checklist.
- Incident ke baad blameless postmortem template use karo: impact, timeline,
  contributing factors, detection gap, corrective action owner/date.

**Proof:** Backup file hona success nahi. Restore karke app query chalana
success ka evidence hai.

## Milestone 10 — Accessibility, visual quality, aur user research

**Samay:** 1 hafta; har baaki milestone ke saath repeat karo.

### Exercise 10.1 — Customer task khud test karo

Browser mein bina code padhe yeh kaam karo:

1. GitHub sign in.
2. Domain add karo.
3. Tracking snippet copy karo.
4. Date range/timezone change karo.
5. Live dashboard kholo.
6. Notification open/read karo.
7. Payment flow ko sandbox/mock mode mein open/cancel karo.

Har step ka screenshot nahi balki task result, confusion, error aur next
action note karo. Kisi dost ko task do aur chup-chaap observe karo; unhe
instructions mat do.

### Exercise 10.2 — Keyboard/screen-reader pass

- Tab/Shift+Tab se main nav, domain switch, date picker, timezone picker,
  dialogs, notifications aur checkout operate karo.
- Focus visible hai? Dialog close ke baad focus wapas aata hai?
- Loading/error status announce hota hai?
- Chart ka text/table alternative hai?
- Theme change ke baad contrast aur focus ring dikh raha hai?
- Findings ko severity aur reproducible steps ke saath likho.

### Exercise 10.3 — Responsive/performance pass

- 320px/375px mobile, tablet, laptop, large display par dashboard inspect
  karo.
- Long hostname, long page path, empty data, many dimensions, chart resize
  test karo.
- DevTools performance/network se largest assets, JS, fonts, hydration,
  render cost note karo.
- Ek measured performance issue choose karo; profiling before/after evidence
  ke bina memoization/random optimization mat add karo.

## Milestone 11 — Har feature ke liye non-code product packet banao

Full-stack engineer sirf implementation nahi karta. Neeche ke documents tum
khud likho, chhote aur specific:

### 11.1 Metric dictionary

`views`, `visitors`, `unique per hour/day`, `exit`, `referrer`, `previousPage`,
`country`, `page flow`, `live visitor` ke liye:

- Exact definition.
- Query window/timezone.
- Deduplication rule.
- Missing/unknown treatment.
- Known limitations.
- UI label/customer explanation.

### 11.2 Data inventory/retention

Har field ke liye purpose, source, sensitivity, storage, consumers, retention,
deletion behavior aur third-party sharing likho. `visitorId` ko “anonymous”
mat label karo jab tak re-identification threat evaluate na ho.

### 11.3 API/event contract

Version, required fields, optional fields, examples, validation, errors,
retryability, idempotency, compatibility rule aur deprecation timeline likho.
Old tracker script ke saath new collector behavior bhi test karo.

### 11.4 Decision record

Har architecture choice par one page: problem, constraints, options, chosen
option, why not alternatives, cost/risk, revisit trigger. Example: Redis Pub/Sub
vs Kafka broadcast for multiple WebSocket instances.

### 11.5 Support/runbook

Customer “data nahi aa raha” bole toh checklist:

1. Script loaded? Browser request URL/status?
2. API key/domain match?
3. Origin/domain verification?
4. Collector response meaning?
5. Kafka publish/lag?
6. DB row saved?
7. Analytics route auth/cache/query?
8. Frontend correct domain/date/timezone?
9. Live socket connected/fresh?

Isse debugging systematic hoti hai, random code edit nahi.

## Milestone 12 — Capstone: ek end-to-end feature khud own karo

Upar ke milestones ke baad inme se **sirf ek** choose karo:

1. **Event delivery guarantee:** schema validation → stable event ID →
   Kafka → retryable/idempotent DB write → visible delivery status.
2. **Timezone-correct timeseries:** strict date input → SQL local buckets →
   unique response bucket IDs → Query key/cache version → chart display.
3. **Reliable live dashboard:** multi-instance fanout → nullable novelty →
   bounded client queue → reconnect reconciliation → freshness UI.
4. **Payment correctness:** atomic payment claim → idempotent domain extension
   → provider reconciliation → accurate pending/confirmed frontend states.
5. **Domain ownership verification:** proof challenge → verified state →
   collector enforcement → user guidance → expiry/transfer/revocation.

### Capstone ko khud deliver karne ke exact steps

1. Bug/need ko ek sentence mein define karo; user impact quantify karo.
2. Current files aur calls trace karke sequence diagram banao.
3. Current behavior ka automated failing test ya manual reproduction banao.
4. Data contract aur backward compatibility likho.
5. 2–3 design options aur failure modes compare karo.
6. Implementation ko chhote commits/diffs mein karo.
7. Unit + integration + relevant UI test likho.
8. Typecheck/lint/build aur end-to-end flow chalao.
9. Logs/metrics/runbook update karo.
10. Local/safe staging par deploy, verify aur rollback practice karo.
11. 10-minute demo do: problem, prior behavior, design, code, evidence,
    tradeoff, remaining risk.
12. Retrospective: kaunsa assumption galat nikla? Agli baar kya pehle measure
    karoge?

## Hafte ka schedule: codebase ke context ke saath

8–12 ghante/week ka sample:

| Session | Kya karna hai |
|---|---|
| 1 (1.5h) | Ek repo flow trace; caller + callee padho, diagram banao |
| 2 (2h) | Related framework concept padho, current code se connect karo |
| 3 (3h) | One small code exercise/test implement karo |
| 4 (1.5h) | Local integration/browser/failure scenario verify karo |
| 5 (1h) | Docs/runbook/metric definition update karo |
| 6 (1h) | 5 interview questions bina answer dekhe bolkar jawab do; diff self-review |

Har chauthe hafte naya feature mat add karo. Existing work retest karo,
architecture diagram memory se redraw karo, aur fake incident solve karo.

## Pehle 4 weeks ka exact starter plan

### Week 1 — App chalao aur map banao

- Day 1: `README.md`, root `package.json`, `turbo.json`, all package scripts.
- Day 2: Docker Compose services, env checklist, safe startup/stop.
- Day 3: tracker → collector flow diagram.
- Day 4: collector → Kafka → DB/WebSocket flow diagram.
- Day 5: dashboard route → hook → API → DB query flow.
- Day 6: local main journey manually; errors/logs note.
- Day 7: diagrams ko bina files dekhe dobara banao; gaps fill karo.

**Week complete tab:** setup repeat ho aur tum teen diagrams explain kar sako.

### Week 2 — Ek browser event ko DB tak follow karo

- `script.js` payload inspect/test.
- `collector.route.ts` response branches list.
- `collector.service.ts` enrichment and Kafka sends trace.
- `dumping.worker.ts` + `dumpInDB.ts` DB mapping test.
- Prisma `PageVisit` model aur indexes match karo.
- Invalid input aur DB failure ka expected behavior test design karo.

**Week complete tab:** ek event ke fields ka source-to-storage table ho aur
failure par expected status/retry clear ho.

### Week 3 — Analytics query se chart tak

- Timeseries route/access/validation inspect.
- `fetchTimeseriesData.ts` SQL aur date bounds print/verify.
- `useTimeseries.ts` query key/API params match karo.
- Timeseries card state/error/loading inspect.
- Local data par one date/timezone boundary reproduce karo.

**Week complete tab:** chart ke ek point ka exact DB rows se calculation
samjha sako.

### Week 4 — Test foundation + ek real fix

- Current repository test scripts/dependencies verify.
- Minimal unit test setup plan karo; pehle team/user repo conventions dekho.
- Pure helper ke tests likho; test command root/workspace mein document karo.
- Ek verified bug choose karo (date validation, lock cleanup, GeoIP
  initialization, swallowed DB error—reproduce ke baad).
- Fix + regression test + typecheck/build + short explanation complete karo.

**Week complete tab:** kisi aur developer ko test command dekar wahi result
repeat karwa sako.

## P0 order: agar time kam ho

Is order ko mat badlo jab tak current evidence koi urgent blocker na dikhaye:

1. Local stack aur real user/event trace samajhna.
2. Automated test foundation aur deterministic repro.
3. Tenant authorization/secret/privacy boundaries prove karna.
4. Event loss/duplicate behavior prove karna.
5. Date/timezone/metric definitions prove karna.
6. Payment duplicate settlement risk test karna.
7. Build/deployment health/TLS/startup behavior verify karna.
8. Realtime reconnect/live metric correctness.
9. Accessibility and visual polish.
10. Scaling/partitioning/multi-region only after measuring need.

Naya chart ya AI feature add karna tempting ho sakta hai. Pehle existing number
correct hai, tenant-safe hai aur outage par explainable hai—yeh prove karo.

## Apni progress ko objectively kaise naapna hai

Har topic ke liye 0–4 score do:

- **0:** File ya concept locate nahi kar sakta.
- **1:** Sirf happy path repeat kar sakta hoon.
- **2:** Failure/edge case aur code location explain kar sakta hoon.
- **3:** Test likh sakta hoon aur alternatives/tradeoffs compare kar sakta hoon.
- **4:** Implement, deploy/operate, rollback aur doosre developer ko sikha
  sakta hoon.

Mastery ke liye har P0 topic mein 3+ score; capstone ke topic mein 4 score
target karo. Har 4 hafte purane scores dobara do—improvement yaad se nahi,
evidence se measure karo.

## Interview documents ko daily kaise use karna

- Har session se pehle related 3–5 questions choose karo.
- Answer guide band rakho. Pehle code path/failure aloud explain karo.
- Agar exact behavior yaad nahi, file kholkar prove karo; guess ko fact mat
  banao.
- Answer ke baad code mein relevant branch/test dhoondo.
- Jo answer repository se match nahi karta, us discrepancy ko learning log mein
  note karo aur guide/documentation review karo.
- Har week ek “teach-back”: kisi ko event delivery, Query cache ya payment
  lifecycle whiteboard par samjhao.

## Tum “full-stack strong” kab hoge?

Jab tum:

- Browser event, API, worker, DB, cache aur chart ko bina hand-wave trace kar
  sako.
- TypeScript types aur runtime validation ka farq samjha sako.
- Auth/tenant checks ko har entrypoint par prove kar sako.
- SQL result ka meaning timezone aur null semantics ke saath explain kar sako.
- Retry/duplicate/partial failure ka recovery plan bana sako.
- React Query/Redux state ownership aur stale UI explain kar sako.
- Tailwind/UI ko accessible aur responsive test kar sako.
- Payment/AI features mein browser ko authority na maan kar server trust
  boundaries enforce kar sako.
- Dependency failure par logs, metrics aur data recovery se incident solve kar
  sako.
- Product ko bata sako kya guaranteed hai, kya approximate hai, kya collect
  hota hai aur data kitni der rehta hai.
- Apne design ka downside bhi khud bata sako.

Is plan ka pehla kaam “sab kuch padhna” nahi hai. Pehla kaam Week 1 ka
repeatable local run, diagrams, aur ek real browser event ka trace complete
karna hai. Uske baad hi code change choose karo.
