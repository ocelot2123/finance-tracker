# Finance Tracker

Minimal Next.js webhook receiver for `inbound.new`.

Package manager: `bun`.

It does 3 things:
- requires a shared bearer API key
- verifies inbound.new webhook requests
- logs a truncated payload snapshot to Vercel logs
- returns a small JSON summary so you can inspect the shape fast

## Setup

1. Install deps:

```bash
bun install
```

2. Create `apps/web/.env.local` from `apps/web/.env.example`.

3. Configure your inbound.new webhook endpoint to send this custom header:

```text
Authorization: Bearer <your INBOUND_WEBHOOK_API_KEY>
```

4. Start dev:

```bash
bun run dev
```

5. Optional checks:

```bash
bun run typecheck
bun run build
```

6. Point your inbound.new webhook endpoint at:

```text
https://your-domain/api/inbound
```

## Required env

```bash
INBOUND_API_KEY=
INBOUND_WEBHOOK_API_KEY=
```

## Notes

- App-level auth expects `Authorization: Bearer <INBOUND_WEBHOOK_API_KEY>`.
- Auth uses inbound.new's webhook verification helper.
- Logged headers redact `authorization`, `cookie`, and `x-webhook-verification-token`.
- Logged payload values are truncated to preserve shape without dumping unlimited email body data.
- Vercel should detect Bun from `bun.lock` and `packageManager`.
