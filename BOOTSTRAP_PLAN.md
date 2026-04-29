# Finance Tracker Bootstrap Plan

## Locked Decisions

- Single-user MVP first
- Better Auth with Google OAuth
- Bun + Turborepo
- Next.js FE + API on Vercel
- Convex for database/backend
- Effect for domain logic and service boundaries
- inbound.new for inbound email
- OpenTelemetry in Next/Vercel first, exported to Axiom
- DBS + UOB credit card emails first
- Singapore / SGD first
- Rules-based categorization plus AI provider abstraction
- No manual review queue in the first milestone
- Normalized-only email storage
- Basic spend dashboard in v1

### Architecture decisions now locked

- Use official Better Auth + Convex integration via `@convex-dev/better-auth`
- Do not use a separate SQL auth database
- Treat v1 as a learning-first prototype
- Treat the app as personal-use for now, with possible future public/multi-user expansion
- Preserve clean ownership and service boundaries for a future multi-user path, but do not implement multi-user behavior in v1
- Enforce single-user access in v1 with a hard allowlist on your Google account
- Secure the inbound webhook with a shared key only, not provider verification
- Use the hybrid auth/data model:
  - Better Auth + Convex provider for client-side authenticated Convex usage
  - Next server helpers for auth checks, SSR preload, and route handlers
- Model issuer emails as `authorization events`, not final settled ledger records
- Represent money as `minor units + currency`
- Keep production storage normalized-only
- Keep sanitized sample emails in repo fixtures for parser maintenance
- Keep categorization rules hardcoded in typed code for v1
- Store only the final category on transactions, with no categorization provenance metadata
- Use random sortable IDs like ULIDs for primary keys
- Do not implement inbound idempotency or transaction dedupe in v1
- Parse failures are log-only, not stored durably
- Allow loose debugging logs in all environments
- Use separate Convex preview deployments for Vercel preview branches
- Auto-seed preview deployments with a small deterministic dataset
- v1 dashboard includes both transaction detail and summary views
- Keep core integration packages on `latest` during early development
- Keep AI at the abstraction/interface layer only in v1
- Keep early testing minimal while the app shape settles
- Use preview deployments, not local tunnels, as the main webhook testing loop

### Explicitly accepted risks

- No inbound idempotency: duplicate provider deliveries may create duplicate transactions
- No dedupe key: duplicate or replayed notifications may double-count spend
- Shared-key-only webhook trust: forged or misrouted requests are less defensible than provider-verified requests
- One sample email per issuer: parser rewrites are expected once real-world variation appears
- Category-only storage: later recategorization/backfill will be blind
- Log-only parse failures: there will be no durable failed-event queue or replay list
- Loose debugging in all environments: sensitive finance/email details may leak into hosted logs and traces
- Floating core package versions: integrations may shift underneath you while you are still learning them
- Minimal early tests: parser and ingest regressions may slip through until later hardening
- Even future production is currently assumed to not require inbound idempotency, categorization provenance, or stronger test coverage

### High-priority follow-ups created by these decisions

- The plan should teach `@convex-dev/better-auth`, Convex components, and Convex auth helpers early
- The plan should treat parser fixture quality as a major source of correctness risk
- The plan should keep risk notes visible anywhere it mentions v1 simplicity
- The plan should include a preview seed function for separate Convex preview deployments
- The plan should separate parser/rules correctness from any future AI behavior
- The plan should clearly label which omissions are intentional, not accidental
- The plan should require a logging/privacy review before any future public launch

## Current Repo State

The repo already has:

- root Bun workspace
- Turborepo root config
- `apps/web` Next.js app
- a minimal `app/api/inbound` webhook receiver

The repo does not yet have:

- Convex
- Better Auth
- Effect packages
- shared monorepo packages
- OTEL / Axiom wiring
- parser/categorization pipeline
- dashboard data model

## Hard Constraints And Non-Obvious Integrations

These are the parts most likely to surprise you if you try to wire the stack by intuition.

### Better Auth can run inside Convex via the official integration

- Better Auth has an official Convex integration documented at `better-auth.com/docs/integrations/convex`
- That integration is built around `@convex-dev/better-auth`
- Better Auth auth state can therefore live through the Convex component path instead of a separate SQL database

For your stack, the updated mental model is:

- Better Auth owns login, sessions, OAuth callback handling
- Convex hosts the Better Auth component and app data
- Next.js is the web shell that proxies auth routes, renders pages, and receives inbound webhooks

This means you now need to learn:

- Better Auth + Convex component integration
- Convex app data and workflows

### Better Auth + Convex client auth is not turnkey

- The earlier version of this plan assumed custom OIDC/JWT work would be required
- That assumption is now superseded by the official Better Auth + Convex integration
- You should still learn where Next server helpers fit vs where Convex React hooks fit

For v1, the lowest-friction approach is:

- use Better Auth + Convex provider for authenticated client-side Convex usage
- use Next server helpers for route protection, token bootstrap, SSR preload, and route handlers
- avoid inventing your own custom auth plumbing

This keeps the first milestone aligned with the official integration path.

### Webhook ingress should stay in Next.js, not Convex

- inbound.new already fits naturally into a Next route handler
- request verification and header handling are easiest in a Node route handler
- the route should persist fast, then hand off to Convex

### Convex runtime split matters

- queries and mutations run in Convex's default deterministic runtime
- actions can run in default runtime or Node.js via `"use node"`
- if you import Node-only libraries into shared Convex code, bundling will break

### OTEL scope should start in Next, not everywhere at once

- Next.js on Vercel has a clear `instrumentation.ts` story via `@vercel/otel`
- Convex tracing is possible, but not the first thing to force
- start with Next/Vercel traces and structured Convex logs

## What To Learn First

Learn these in this order. Each later step depends on the earlier boundaries being clear.

1. Turborepo workspace boundaries
2. Next.js App Router + route handlers on Vercel
3. Better Auth database model + Next.js integration
4. Convex queries, mutations, actions, scheduling
5. Effect services, layers, schemas, typed errors
6. inbound.new webhook verification and payload shape
7. OpenTelemetry basics and `@vercel/otel`
8. Axiom OTLP ingestion
9. Parser design for issuer-specific email formats
10. Rules engine design for categorization

## Primary References

Read these before you start wiring code. This is the minimum doc map for building the stack by hand.

Package-manager translation note:

- most official docs will show `npm`, `pnpm`, or `npx`
- for this repo, translate those to `bun add`, `bun run`, and `bunx` where appropriate
- do not cargo-cult commands; understand what each command is doing before converting it to Bun

### Reference app to inspect

- Root repo: `https://github.com/RhysSullivan/create-epoch-app`
- Root workspace wiring: `https://github.com/RhysSullivan/create-epoch-app/blob/main/package.json`
- Turbo pipeline shape: `https://github.com/RhysSullivan/create-epoch-app/blob/main/turbo.json`
- Next monorepo transpilation pattern: `https://github.com/RhysSullivan/create-epoch-app/blob/main/apps/main-site/next.config.ts`
- Convex schema package pattern: `https://github.com/RhysSullivan/create-epoch-app/blob/main/packages/database/convex/schema.ts`
- Convex context tag pattern: `https://github.com/RhysSullivan/create-epoch-app/blob/main/packages/database/convex/confect.ts`
- Effect context adapter pattern: `https://github.com/RhysSullivan/create-epoch-app/blob/main/packages/confect/src/ctx.ts`
- Runtime boundary injection pattern: `https://github.com/RhysSullivan/create-epoch-app/blob/main/packages/confect/src/rpc/server.ts`
- Client provider pattern: `https://github.com/RhysSullivan/create-epoch-app/blob/main/packages/ui/src/components/convex-client-provider.tsx`
- Axiom OTLP config pattern: `https://github.com/RhysSullivan/create-epoch-app/blob/main/packages/observability/src/axiom.ts`
- Effect tracing layer pattern: `https://github.com/RhysSullivan/create-epoch-app/blob/main/packages/observability/src/effect-otel.ts`
- Convex tracing shim pattern: `https://github.com/RhysSullivan/create-epoch-app/blob/main/packages/observability/src/convex-effect-otel.ts`
- Next instrumentation entrypoint pattern: `https://github.com/RhysSullivan/create-epoch-app/blob/main/apps/main-site/src/instrumentation.ts`

### Next.js docs

- Instrumentation guide: `https://nextjs.org/docs/app/guides/instrumentation`
- Instrumentation file reference: `https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation`
- OpenTelemetry guide: `https://nextjs.org/docs/app/guides/open-telemetry`
- Route handlers: `https://nextjs.org/docs/app/api-reference/file-conventions/route`
- Deploying: `https://nextjs.org/docs/app/getting-started/deploying`

### Vercel docs

- Tracing and instrumentation: `https://vercel.com/docs/tracing/instrumentation`

### Turborepo docs

- Structuring a repository: `https://turborepo.com/docs/crafting-your-repository/structuring-a-repository`
- Using environment variables: `https://turborepo.com/docs/crafting-your-repository/using-environment-variables`

### Better Auth docs

- Introduction: `https://www.better-auth.com/docs/introduction`
- Installation: `https://www.better-auth.com/docs/installation`
- Basic usage: `https://www.better-auth.com/docs/basic-usage`
- Next.js integration: `https://www.better-auth.com/docs/integrations/next`
- Convex integration: `https://better-auth.com/docs/integrations/convex`
- Database model: `https://www.better-auth.com/docs/concepts/database`
- Google provider: `https://www.better-auth.com/docs/authentication/google`
- PostgreSQL adapter: `https://www.better-auth.com/docs/adapters/postgresql`

### Convex docs

- Next.js quickstart: `https://docs.convex.dev/quickstart/nextjs`
- Next.js App Router: `https://docs.convex.dev/client/nextjs/app-router`
- Next.js server rendering: `https://docs.convex.dev/client/nextjs/app-router/server-rendering`
- Actions: `https://docs.convex.dev/functions/actions`
- Runtimes: `https://docs.convex.dev/functions/runtimes`
- Scheduled functions: `https://docs.convex.dev/scheduling/scheduled-functions`
- Vercel hosting: `https://docs.convex.dev/production/hosting/vercel`
- Custom OIDC auth: `https://docs.convex.dev/auth/advanced/custom-auth`
- Environment variables: `https://docs.convex.dev/production/environment-variables`
- Testing with `convex-test`: `https://docs.convex.dev/testing/convex-test`

### Effect docs

- Getting started: `https://effect.website/docs/getting-started/introduction/`
- Using generators: `https://effect.website/docs/getting-started/using-generators/`
- Managing services: `https://effect.website/docs/requirements-management/services/`
- Managing layers: `https://effect.website/docs/requirements-management/layers/`
- Schema introduction: `https://effect.website/docs/schema/introduction/`
- Schema basic usage: `https://effect.website/docs/schema/basic-usage/`
- Tracing: `https://effect.website/docs/observability/tracing/`

### inbound.new references

- SDK repo: `https://github.com/inboundemail/inbound-typescript-sdk`
- Webhook verification implementation: `https://github.com/inboundemail/inbound-typescript-sdk/blob/main/src/lib/webhooks.ts`
- Endpoint API: `https://github.com/inboundemail/inbound-typescript-sdk/blob/main/src/resources/endpoints.ts`
- Email API: `https://github.com/inboundemail/inbound-typescript-sdk/blob/main/src/resources/emails.ts`
- Official Next example: `https://github.com/inboundemail/susbound`
- Example route handler: `https://github.com/inboundemail/susbound/blob/main/app/api/inbound/route.ts`

### OTEL / Axiom docs

- Axiom OTEL ingestion: `https://axiom.co/docs/send-data/opentelemetry`
- OpenTelemetry primer: `https://opentelemetry.io/docs/concepts/observability-primer/`

## create-epoch-app Patterns To Copy Vs Study Only

Patterns worth copying:

- root workspace shape with `apps/*` and `packages/*`
- Next `transpilePackages` for local workspace packages
- Convex schema and backend code living outside the app package
- Effect tags and runtime adapters around Convex context
- central observability package instead of tracing code spread everywhere
- dedicated `instrumentation.ts` entrypoint for server instrumentation

Patterns to study but not copy blindly:

- Bun catalogs and package choices unrelated to your app
- Sentry-specific instrumentation
- any `ignoreBuildErrors` style config in Next
- auth/storage decisions that assume their app, not yours

The most important create-epoch-app lesson is architectural, not literal:

- app packages should be thin
- shared packages should hold reusable domain and infra code
- runtime context should be injected at boundaries, not passed through the whole system as ad hoc objects

## Target Scaffold

```text
apps/
  web/
    src/
      app/
        api/
          auth/[...all]/route.ts
      instrumentation.ts
      lib/
        auth.ts
        auth-client.ts
        auth-server.ts
        convex.ts
        env.ts
    components/
      ConvexClientProvider.tsx
packages/
  config/
  domain/
  services/
  observability/
  convex-backend/
```

Recommended package roles:

- `apps/web`: UI, route handlers, Better Auth wiring, OTEL entrypoint
- `apps/web/src/lib/auth-server.ts`: Better Auth + Convex Next helpers for SSR, auth route proxying, and server calls
- `packages/config`: typed env readers, shared config shapes
- `packages/domain`: Effect schemas, ADTs, parser outputs, transaction types
- `packages/services`: Effect service tags and live/test layers
- `packages/observability`: Axiom exporter config, trace helpers, safe telemetry helpers
- `packages/convex-backend`: Convex schema, queries, mutations, actions, generated client

Recommended auth shape for v1:

- Better Auth uses the official Convex integration
- Next proxies `/api/auth/[...all]` using Better Auth + Convex server helpers
- protected pages use Next auth helpers where useful
- private finance data uses the hybrid provider model:
  - client-side Convex hooks for reactive data
  - server helpers for auth checks and SSR preload

## Step-By-Step

### Step 1: Clean monorepo foundation

Learn:

- how Turbo workspaces compose apps and packages
- how `transpilePackages` works in Next.js
- how envs affect Turbo cache correctness

Set up:

- a shared `tsconfig` base
- `packages/config`
- `packages/domain`
- `packages/services`
- `packages/observability`
- `packages/convex-backend`
- Turbo env declarations for app and build tasks

Rough how:

- keep `apps/web` as the only app for now
- add minimal `package.json` files per package
- add a base TypeScript config and extend it from each workspace
- make Next transpile shared packages
- keep env files local to `apps/web`

Done when:

- `bun run typecheck` works across root and `apps/web`
- shared packages import cleanly from `apps/web`

### Step 2: Learn Next.js boundaries before adding more tools

Learn:

- server components vs client components
- route handlers
- `runtime = "nodejs"`
- what should stay in `src/lib` vs shared packages

Set up:

- keep webhook ingress in `apps/web/src/app/api/inbound/route.ts`
- keep all external HTTP entrypoints in Next first

Rough how:

- treat route handlers as thin adapters
- verify request, decode payload, call one domain/backend function, return fast
- avoid doing parsing or categorization directly in the route

Done when:

- the webhook route remains a thin boundary, not a business-logic dump

### Step 3: Add Convex early

Learn:

- Convex schema design
- query vs mutation vs action
- scheduled work
- Next App Router integration

Set up:

- Convex project and generated API
- schema for inbound emails, transactions, categories, rules
- Better Auth Convex component scaffold
- auth-aware Convex access from Next where needed
- one test query and one test mutation

Rough how:

- keep durable state in Convex
- use mutations for inserts/state transitions
- use actions for external or heavier processing only when needed
- schedule background processing from a mutation so persistence and scheduling stay atomic
- use the Better Auth + Convex hybrid provider model for private dashboard data in v1

Start with these tables:

- `inboundEmails`
- `transactions`
- `categories`
- `categoryRules`
- `merchantAliases`

Because you chose normalized-only storage, `inboundEmails` should keep:

- provider IDs
- sender / subject metadata
- issuer
- extracted normalized facts
- parse status
- failure reason
- dedupe fingerprint

Avoid storing full raw text/html by default.

Done when:

- the app can write and read sample transaction data through Convex

### Step 4: Add Better Auth via Convex before dashboard work

Learn:

- Better Auth Next.js integration
- Google OAuth flow
- session handling in App Router

Set up:

- Better Auth config via Convex component
- Google OAuth provider
- `/api/auth/[...all]` route
- Convex auth config and component registration
- Next auth server helpers
- session-aware app shell
- single-user allowlist check for your Google account

Rough how:

- keep auth in `apps/web`
- keep auth wiring aligned with the official Better Auth + Convex docs
- keep user identity minimal in v1
- avoid building multi-tenant abstractions now
- if the app is truly single-user, reject non-allowlisted emails after Google login

Done when:

- you can sign in with Google and gate the dashboard behind auth

### Step 5: Add Effect as the domain layer

Learn:

- `Effect.gen`
- service tags
- layers
- Effect Schema
- typed error modeling

Set up:

- domain types for `InboundEmail`, `ParsedTransaction`, `NormalizedTransaction`, `CategorySuggestion`
- service interfaces for parser repo, transaction repo, categorizer, clock, logger
- one boundary helper to run an Effect program from Next or Convex

Rough how:

- keep Effect code free of `NextRequest`, `Response`, Convex `ctx`, and raw `process.env`
- use shared packages for pure logic and interfaces
- inject adapters at the edge

Good pattern:

- `packages/domain`: pure data shapes and transforms
- `packages/services`: interfaces and live/test implementations
- `apps/web` and `packages/convex-backend`: thin runtime adapters

Done when:

- a parser/categorizer program can run in tests without Next or Convex attached

### Step 6: Replace log-only webhook flow with durable ingest

Learn:

- inbound.new webhook verification
- event payload shape
- retry behavior and idempotency needs

Set up:

- verified webhook route in Next
- one Convex mutation like `recordInboundEmail`
- dedupe by provider email ID / message ID
- background processor schedule

Rough how:

- Next route verifies inbound.new request
- route sends one normalized payload into Convex
- Convex mutation writes the event and schedules processing
- return `200` or `202` quickly

Important pattern:

- ingress should be fast and durable
- parsing should happen after persistence, not inline with the webhook response

Done when:

- duplicate webhook deliveries do not create duplicate transactions

### Step 7: Build issuer-specific parser modules for DBS and UOB

Learn:

- how DBS emails encode amount, merchant, date, card suffix
- how UOB emails encode the same fields
- how to keep parser code explicit and testable

Set up:

- sample fixture files for DBS and UOB emails
- one parser module per issuer
- one parser registry that picks the right parser from sender/subject/body shape
- parser test suite

Rough how:

- parse to a typed intermediate result first
- normalize merchant, amount, currency, and timestamp after parsing
- return explicit parse errors instead of silent fallbacks

Recommended parser shape:

- `UnknownIssuer`
- `UnsupportedFormat`
- `ParsedCandidate`
- `LowConfidenceCandidate`

Done when:

- fixtures from DBS and UOB produce stable parsed outputs in tests

### Step 8: Add categorization as rules first, AI boundary second

Learn:

- deterministic rule engines
- merchant alias normalization
- how to design an AI provider interface without binding to one model yet

Set up:

- category table
- category rule table
- merchant alias table
- `Categorizer` Effect service interface
- `RulesCategorizer` live implementation
- `AiCategorizer` interface stub only

Rough how:

- run rules first
- if no strong rule matches, produce `Uncategorized` plus optional suggestion slot
- do not wire a real LLM yet
- keep a provider-neutral interface so you can plug in OpenAI or Anthropic later

Done when:

- transactions get a deterministic category or a clear uncategorized result

### Step 9: Add the spend dashboard after data flow works

Learn:

- Convex queries for aggregate reads
- client/server data boundaries in Next
- simple dashboard composition

Set up:

- summary query by date range
- totals by category
- recent transactions list
- uncategorized count

Rough how:

- keep dashboard simple first
- one page with total spend, category split, recent activity
- avoid over-designing charts before the data model settles

Done when:

- you can sign in and see categorized spend from parsed emails

### Step 10: Add OTEL and Axiom after core writes work

Learn:

- `instrumentation.ts` in Next
- `@vercel/otel`
- span naming
- safe telemetry fields
- OTLP export to Axiom

Set up:

- `apps/web/src/instrumentation.ts`
- `packages/observability` for Axiom config
- traces from webhook ingress and dashboard/server actions
- resource attrs for service name and environment

Rough how:

- instrument Next first
- export traces to Axiom OTLP endpoints
- avoid raw email content in spans
- store IDs, parse status, counts, confidence, issuer, category IDs only

Suggested first spans:

- `inbound.webhook.receive`
- `inbound.webhook.verify`
- `convex.recordInboundEmail`
- `transaction.parse`
- `transaction.categorize`

Done when:

- you can see webhook and parse traces in Axiom for a sample transaction

## Detailed Study Path

This section is the real build order if you are doing the work manually and want to understand each layer before wiring the next one.

### Phase 0: Read the repo-shape references before writing more code

Goal:

- understand how a serious monorepo keeps app code, backend code, and shared runtime helpers separated

Read first:

- `https://github.com/RhysSullivan/create-epoch-app/blob/main/package.json`
- `https://github.com/RhysSullivan/create-epoch-app/blob/main/turbo.json`
- `https://github.com/RhysSullivan/create-epoch-app/blob/main/apps/main-site/next.config.ts`
- `https://turborepo.com/docs/crafting-your-repository/structuring-a-repository`
- `https://turborepo.com/docs/crafting-your-repository/using-environment-variables`

What to learn from those files:

- how the root scripts delegate to Turbo
- how workspace packages are organized under `apps/*` and `packages/*`
- how Next is configured to transpile shared workspace packages
- how env changes need to affect build caching

What to build by hand:

- a root TypeScript base config
- minimal `package.json` files for `packages/config`, `packages/domain`, `packages/services`, `packages/observability`, `packages/convex-backend`
- a `next.config.ts` that transpiles those packages
- Turbo task inputs that include `.env*`

Questions to answer before moving on:

- which code belongs in `apps/web/src/lib`
- which code belongs in reusable packages
- which env vars belong to web build vs runtime only

### Phase 1: Master the Next.js boundary first

Goal:

- understand what Next is responsible for in this architecture

Read:

- `https://nextjs.org/docs/app/api-reference/file-conventions/route`
- `https://nextjs.org/docs/app/guides/instrumentation`
- `https://nextjs.org/docs/app/guides/open-telemetry`
- `https://nextjs.org/docs/app/getting-started/deploying`

Learn these specifics:

- App Router file conventions
- route handlers vs server components vs client components
- why your inbound webhook route should stay `runtime = "nodejs"`
- where `instrumentation.ts` lives and when `register()` runs

Manual exercises:

- trace the current `apps/web/src/app/api/inbound/route.ts`
- explain what logic should stay there and what should be moved out later
- create one extra toy route handler that validates JSON and returns a typed result

Integration to understand:

- Next is your HTTP edge
- inbound.new talks to Next
- browser talks to Next
- Better Auth route lives in Next
- OTEL bootstrap starts in Next

Do not move on until you can explain:

- why the webhook route should not parse and categorize transactions inline
- why Next is the place where auth, headers, cookies, and provider callbacks meet

### Phase 2: Learn Better Auth as a Convex-backed subsystem

Goal:

- understand that auth is its own storage and routing problem

Read:

- `https://www.better-auth.com/docs/introduction`
- `https://www.better-auth.com/docs/installation`
- `https://www.better-auth.com/docs/basic-usage`
- `https://www.better-auth.com/docs/integrations/next`
- `https://better-auth.com/docs/integrations/convex`
- `https://www.better-auth.com/docs/concepts/database`
- `https://www.better-auth.com/docs/authentication/google`
- `https://www.better-auth.com/docs/adapters/postgresql`

Learn these specifics:

- Better Auth route mounting at `/api/auth/[...all]`
- server auth instance vs client auth instance
- session lookup in server components using `headers()`
- Google OAuth callback URL shape
- Better Auth Convex component structure
- Next proxy route pattern for Better Auth + Convex
- how Convex auth helpers fit with client hooks and SSR preload

Manual exercises:

- draw the Google OAuth round trip on paper from `/sign-in` to `/api/auth/callback/google` back to your app
- explain which env vars must match between localhost and production
- create a small standalone Better Auth test app if needed before putting it into this repo

Files you will likely create in this repo:

- `apps/web/src/lib/auth.ts`
- `apps/web/src/lib/auth-client.ts`
- `apps/web/src/lib/auth-server.ts`
- `apps/web/src/app/api/auth/[...all]/route.ts`
- `apps/web/src/app/sign-in/page.tsx`
- `apps/web/src/components/ConvexClientProvider.tsx`

Recommended implementation detail:

- use the official Better Auth + Convex integration as documented
- do not invent your own auth plumbing if the component already provides it

Do not move on until you can answer:

- how the Better Auth Convex component is mounted
- how a server component checks session state
- what the Google redirect URI must be locally and on Vercel

### Phase 3: Learn Convex as the app database and workflow engine

Goal:

- understand the Convex execution model before mixing it with Effect

Read:

- `https://docs.convex.dev/quickstart/nextjs`
- `https://docs.convex.dev/client/nextjs/app-router`
- `https://docs.convex.dev/client/nextjs/app-router/server-rendering`
- `https://docs.convex.dev/functions/actions`
- `https://docs.convex.dev/functions/runtimes`
- `https://docs.convex.dev/scheduling/scheduled-functions`
- `https://docs.convex.dev/production/hosting/vercel`
- `https://docs.convex.dev/testing/convex-test`

Inspect in create-epoch-app:

- `https://github.com/RhysSullivan/create-epoch-app/blob/main/packages/database/convex/schema.ts`
- `https://github.com/RhysSullivan/create-epoch-app/blob/main/packages/ui/src/components/convex-client-provider.tsx`

Learn these specifics:

- query vs mutation vs action
- deterministic runtime restrictions on queries and mutations
- when to use `"use node"`
- why scheduling from mutations is atomic and scheduling from actions is not
- when to use `fetchQuery` / `fetchMutation` / `fetchAction` from Next
- when to use `useQuery` and why you should defer it for private data until auth is solved cleanly

Manual exercises:

- create a trivial `categories.list` query
- create a trivial `categories.seed` mutation
- call both from a Next server component with `fetchQuery` and a route handler with `fetchMutation`
- run `convex dev` and inspect generated API files

Files you will likely create:

- `packages/convex-backend/convex/schema.ts`
- `packages/convex-backend/convex/categories.ts`
- `packages/convex-backend/convex/inboundEmails.ts`
- `packages/convex-backend/convex/transactions.ts`

Important v1 auth choice:

- use Better Auth to protect pages in Next
- use server-side Convex access from Next for private data first
- postpone direct client-authenticated Convex usage until you explicitly choose to implement custom OIDC

Do not move on until you can explain:

- why a mutation should schedule the background parse work
- why actions are the only safe place for Node-only dependencies
- why server-side `fetchQuery` is simpler than client auth wiring for v1

### Phase 4: Learn Effect as your domain and adapter layer

Goal:

- use Effect for typed business logic, not as a replacement for Next or Convex

Read:

- `https://effect.website/docs/getting-started/introduction/`
- `https://effect.website/docs/getting-started/using-generators/`
- `https://effect.website/docs/requirements-management/services/`
- `https://effect.website/docs/requirements-management/layers/`
- `https://effect.website/docs/schema/introduction/`
- `https://effect.website/docs/schema/basic-usage/`
- `https://effect.website/docs/observability/tracing/`

Inspect in create-epoch-app:

- `https://github.com/RhysSullivan/create-epoch-app/blob/main/packages/database/convex/confect.ts`
- `https://github.com/RhysSullivan/create-epoch-app/blob/main/packages/confect/src/ctx.ts`
- `https://github.com/RhysSullivan/create-epoch-app/blob/main/packages/confect/src/rpc/server.ts`

What to learn from the reference app:

- how tags represent dependencies
- how runtime context is injected at the edge
- how app code can stay unaware of raw request/response objects

Manual exercises:

- write one small Effect service for `Clock`
- write one small Effect service for `MerchantNormalizer`
- write one schema for `ParsedTransaction`
- write one program that normalizes a merchant string and parses an amount

Files you will likely create:

- `packages/domain/src/transaction.ts`
- `packages/domain/src/inbound-email.ts`
- `packages/services/src/parser.ts`
- `packages/services/src/categorizer.ts`
- `packages/services/src/transaction-repo.ts`
- `packages/services/src/live.ts`

The key integration to learn:

- Next route handler should call a thin boundary helper that runs an Effect program
- Convex action should also call a thin boundary helper that runs an Effect program
- the Effect program should depend on interfaces, not on Next or Convex directly

Do not move on until you can explain:

- what a service tag is
- what a layer is
- why `Request`, `NextResponse`, and Convex `ctx` should not leak into `packages/domain`

### Phase 5: Learn inbound.new from code, not assumptions

Goal:

- understand the actual webhook payload and verification path

Read:

- `https://github.com/inboundemail/inbound-typescript-sdk/blob/main/src/lib/webhooks.ts`
- `https://github.com/inboundemail/inbound-typescript-sdk/blob/main/src/resources/endpoints.ts`
- `https://github.com/inboundemail/inbound-typescript-sdk/blob/main/src/resources/emails.ts`
- `https://github.com/inboundemail/susbound/blob/main/app/api/inbound/route.ts`

Learn these specifics:

- webhook headers involved in verification
- the relationship between endpoint config and verification token
- payload fields for message IDs, sender, subject, parsed body, attachments
- whether the package you should install is `inboundemail` or `@inboundemail/sdk`

Manual exercises:

- capture a real sample payload from your current webhook receiver
- document which fields are stable across DBS and UOB notifications
- decide exactly which fields you will keep in normalized-only storage

V1 ingest contract to define by hand:

- `providerEmailId`
- `messageId`
- `issuer`
- `sender`
- `subject`
- `receivedAt`
- `normalizedPayloadVersion`
- `status`

Do not move on until you can explain:

- how the webhook is verified
- how retries can create duplicates
- which email fields you actually need to persist

### Phase 6: Wire Next webhook ingress to Convex durable ingest

Goal:

- replace the current log-only route with durable persistence and async processing

Read again:

- `https://nextjs.org/docs/app/api-reference/file-conventions/route`
- `https://docs.convex.dev/client/nextjs/app-router/server-rendering`
- `https://docs.convex.dev/scheduling/scheduled-functions`

Build by hand:

- a route that verifies the inbound webhook
- a decode step from raw payload to your own normalized ingress type
- a Convex mutation like `recordInboundEmail`
- a scheduled internal action like `processInboundEmail`

Integration specifics to understand:

- Next route should call `fetchMutation`
- Convex mutation should write a durable record and schedule follow-up work
- scheduled action should load the record and call parser logic

Create these state transitions explicitly:

- `received`
- `processing`
- `parsed`
- `persisted`
- `failed`

Manual tests to perform:

- send the same webhook twice and confirm dedupe works
- simulate parse failure and confirm the record ends in `failed`
- inspect scheduled function status in Convex

Do not move on until you can explain:

- why persistence must happen before parsing
- why scheduling from a mutation is safer than scheduling from an action

### Phase 7: Build issuer-specific parser modules for DBS and UOB

Goal:

- extract transactions from known email formats with explicit, testable logic

Read:

- your own saved DBS fixtures
- your own saved UOB fixtures
- Effect Schema docs again for output validation

What to learn:

- sender patterns for each issuer
- subject patterns for each issuer
- amount formatting rules
- date/time wording and timezone assumptions
- how card suffixes are represented

Build by hand:

- `parseDbsEmail`
- `parseUobEmail`
- `selectIssuerParser`
- fixture tests for both issuers

Strong pattern to follow:

- first identify issuer
- then parse issuer-specific fields
- then convert to a shared `ParsedTransaction`
- then normalize into `NormalizedTransaction`

Avoid:

- one giant regex pipeline for all banks
- silent partial parsing without confidence or error state

Do not move on until you can explain:

- how parser failure is represented
- what fields are guaranteed vs inferred
- how you will update parsers when issuers change templates

### Phase 8: Build categorization rules before any real AI integration

Goal:

- make categorization good enough without model dependence

Read:

- Effect services and layers docs again
- your own category taxonomy notes

What to design manually:

- category list
- rule precedence
- merchant alias normalization
- fallback behavior
- provider-neutral AI suggestion interface

Suggested rule dimensions:

- exact merchant alias match
- merchant substring or regex match
- sender-based rule
- account/card-based rule
- currency-based rule if needed later

Build by hand:

- `categoryRules` table
- `merchantAliases` table
- `RulesCategorizer` service
- `AiCategorizer` interface only

Expected v1 result:

- deterministic category if a rule matches
- `Uncategorized` if no rule matches
- optional empty field reserved for future AI suggestion

Do not move on until you can explain:

- why rules should be authoritative in v1
- what information an eventual AI categorizer would receive
- how manual corrections would later become new rules

### Phase 9: Build the dashboard with server-first data flow

Goal:

- show useful spend insights without overcomplicating client state

Read:

- `https://docs.convex.dev/client/nextjs/app-router/server-rendering`
- Next server component docs as needed

What to build by hand:

- one protected dashboard page
- one server component that loads spend summary via `fetchQuery`
- one recent transactions table
- one totals-by-category section

Useful Convex queries:

- `transactions.listRecent`
- `transactions.sumByCategory`
- `transactions.sumByMonth`
- `transactions.countUncategorized`

Recommended v1 rendering approach:

- server-side fetch from Convex for private data
- simple client components only where interaction needs it
- no custom Convex auth integration yet

Do not move on until you can explain:

- why server-side Convex access is enough for the first dashboard
- which parts of the UI actually need client interactivity

### Phase 10: Add observability after the core pipeline is real

Goal:

- observe the actual workflow, not a toy version

Read:

- `https://nextjs.org/docs/app/guides/open-telemetry`
- `https://vercel.com/docs/tracing/instrumentation`
- `https://axiom.co/docs/send-data/opentelemetry`

Inspect in create-epoch-app:

- `https://github.com/RhysSullivan/create-epoch-app/blob/main/packages/observability/src/axiom.ts`
- `https://github.com/RhysSullivan/create-epoch-app/blob/main/packages/observability/src/effect-otel.ts`
- `https://github.com/RhysSullivan/create-epoch-app/blob/main/apps/main-site/src/instrumentation.ts`

What to learn:

- how `registerOTel` bootstraps tracing in Next
- which spans Next already emits for you
- which custom spans you still need
- Axiom dataset separation for traces, logs, and metrics
- why raw email content should never become span attributes

Build by hand:

- `apps/web/src/instrumentation.ts`
- `packages/observability/src/axiom.ts`
- custom span wrappers around webhook verification and Convex calls

First spans to add:

- `inbound.webhook.receive`
- `inbound.webhook.verify`
- `convex.recordInboundEmail`
- `transaction.parse`
- `transaction.categorize`

Do not move on until you can explain:

- where traces start
- where trace context stops in v1
- which identifiers are safe to emit

### Phase 11: Only later, decide whether you need authenticated client-side Convex

Goal:

- postpone the hardest auth integration until you know you need it

Read only if needed:

- `https://docs.convex.dev/auth/advanced/custom-auth`

What this phase means:

- if you want private `useQuery` subscriptions in client components backed by Better Auth identity, you need custom OIDC/JWT work
- that means understanding issuer URL, JWKS, `iss`, `aud`, and how Convex expects ID tokens

Why to defer it:

- it is orthogonal to your real product value
- it increases auth complexity a lot
- you do not need it for a single-user MVP with server-rendered private pages

## Coding Patterns To Keep The Stack Coherent

### Thin boundaries

- Next route handlers should validate, call one function, return
- Convex functions should validate, update state, call domain helpers
- Effect should hold the real business logic

### No framework leakage into domain code

Do not let these escape into `packages/domain`:

- `Request`
- `NextRequest`
- `NextResponse`
- Convex `ctx`
- raw env access

### Prefer explicit state machines

Use a small status model for inbound processing:

- `received`
- `processing`
- `parsed`
- `persisted`
- `failed`

### Keep idempotency first-class

- dedupe on provider email ID and message ID
- derive a transaction fingerprint for parsed results

### Keep issuer support modular

- one parser per issuer
- one shared normalized output shape
- no giant regex file for every bank mixed together

### Keep AI optional

- rule engine should stand on its own
- AI should be an extra suggestion path, not the only categorizer

### Keep telemetry PII-safe

Allowed:

- issuer
- message ID
- parse status
- counts
- confidence
- category ID

Avoid:

- raw email body
- full transaction memo if sensitive
- account numbers
- auth tokens

## Rough Env Matrix

Expect at least these envs later:

```bash
# inbound.new
INBOUND_API_KEY=
INBOUND_WEBHOOK_API_KEY=

# Better Auth / Google, set in Convex where required
BETTER_AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ALLOWED_GOOGLE_EMAIL=
SITE_URL=

# Convex
CONVEX_DEPLOY_KEY=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=
CONVEX_DEPLOYMENT=

# Axiom
AXIOM_TOKEN=
AXIOM_ORG_ID=
AXIOM_TRACES_DATASET=
AXIOM_LOGS_DATASET=
AXIOM_METRICS_DATASET=
```

Keep these typed in shared config code, not scattered through the app.

## Recommended Milestones

1. Monorepo packages compile cleanly
2. Convex connected to Next
3. Better Auth + Convex auth flow works with Google sign-in
4. inbound.new webhook persists verified events
5. DBS parser passes fixtures
6. UOB parser passes fixtures
7. transactions categorize via hardcoded typed rules
8. dashboard shows spend summary via the hybrid provider model
9. OTEL traces visible in Axiom

## What Not To Build Yet

- multi-user tenancy
- manual review queue
- real LLM categorization integration
- attachment parsing
- full raw email archive
- end-to-end Convex tracing gymnastics

## First Implementation Order

If you want the fastest path with the least rework, do it in this exact order:

1. shared package scaffold
2. Convex setup
3. Better Auth + Convex + Google login
4. Effect domain package
5. durable inbound webhook ingest
6. DBS parser
7. UOB parser
8. hardcoded typed rules categorizer
9. spend dashboard
10. OTEL + Axiom

## Unresolved Questions

- exact inbound SDK package name/version
- inbound.new development testing strategy and whether to use a dedicated test inbox
- whether loose debugging logs in all environments remains acceptable after implementation starts
