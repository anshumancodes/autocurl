# autocurl API

This is the standalone Express service used by managed CLI AI discovery.

Required environment:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `CLERK_SECRET_KEY`: Clerk backend secret used by `@clerk/express`.
- `CLERK_WEBHOOK_SECRET`: signing secret for `POST /api/webhooks/clerk`.
- `GEMINI_API_KEY`: server-only Gemini credential.
- `GEMINI_MODEL` (optional): defaults to `gemini-2.0-flash`.
- `GEMINI_TIMEOUT_MS` (optional): defaults to 25 seconds.
- `PORT` (optional): defaults to 3000.
- Billing variables are documented in `.env.example` and `SETUP.md`. Razorpay
  credentials and webhook secrets are server-only; V1 uses only the existing
  monthly Razorpay plan for ₹499/month, and the website receives only
  `NEXT_PUBLIC_RAZORPAY_KEY_ID`.

The production endpoint is `https://api.autocurl.lol/v1/scan`. Never expose
Clerk or Gemini secrets to the CLI or web client.

After changing the Prisma schema:

```bash
npm run db:generate
npm run db:migrate
```

Successful requests are idempotent by `Idempotency-Key`/`request_id`; only a
successful provider response marks usage as charged. Free accounts receive ten
scans in their first 30 days, and Pro accounts receive 100 scans per billing
period. Razorpay subscription lifecycle events are the authority for Pro
entitlements; see `SETUP.md` for test-mode setup.
