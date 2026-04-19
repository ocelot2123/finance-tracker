# Finance Tracker

Minimal Next.js webhook receiver for `inbound.new`.

It does 3 things:
- requires a shared bearer API key
- verifies inbound.new webhook requests
- logs a truncated payload snapshot to Axiom
- returns a small JSON summary so you can inspect the shape fast

## Setup

1. Install deps:

```bash
npm install
```

2. Create `apps/web/.env.local` from `apps/web/.env.example`.

3. Configure your inbound.new webhook endpoint to send this custom header:

```text
Authorization: Bearer <your INBOUND_WEBHOOK_API_KEY>
```

4. Start dev:

```bash
npm run dev
```

5. Point your inbound.new webhook endpoint at:

```text
https://your-domain/api/inbound
```

## Required env

```bash
INBOUND_API_KEY=
INBOUND_WEBHOOK_API_KEY=
AXIOM_API_TOKEN=
AXIOM_DATASET=
```

## Optional env

```bash
AXIOM_BASE_URL=https://api.axiom.co
```

## Notes

- App-level auth expects `Authorization: Bearer <INBOUND_WEBHOOK_API_KEY>`.
- Auth uses inbound.new's webhook verification helper.
- Logged headers redact `authorization`, `cookie`, and `x-webhook-verification-token`.
- Logged payload values are truncated to preserve shape without dumping unlimited email body data.
# finance-tracker
