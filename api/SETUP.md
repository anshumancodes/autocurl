# Razorpay test-mode setup

Billing is implemented in the standalone Express service under `api/`. Use Razorpay test mode during development only.

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, Clerk/Gemini values, `APP_BASE_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. Keep the secret values server-only. V1 uses the existing monthly Razorpay test plan for ₹499/month (`RAZORPAY_CURRENCY=INR`, `PRO_MONTHLY_AMOUNT_MINOR=49900`). Confirm in the Razorpay dashboard that the existing test plan matches these values.
2. Run `npm run db:generate` and `npm run db:migrate`.
3. Set the existing monthly test plan ID in `RAZORPAY_PLAN_ID_MONTHLY`. Do not create another plan.
4. Register `POST https://<api-host>/api/webhooks/razorpay` in Razorpay and subscribe to subscription lifecycle events (`authenticated`, `activated`, `charged`, `pending`, `halted`, `cancelled`, `completed`, and `expired`). The webhook secret must match `RAZORPAY_WEBHOOK_SECRET`.
5. For local testing, expose the API with a tunnel and register its HTTPS URL, or replay signed test fixtures against the raw-body endpoint. The signature is calculated over the exact request body.

Configure Clerk's webhook for `POST /api/webhooks/clerk` and subscribe to
`user.created`, `user.updated`, and `user.deleted`. Deletion is synchronized as
a soft delete so subscriptions and payment history remain available for audit.

The website needs `NEXT_PUBLIC_RAZORPAY_KEY_ID` and the API URL (set as `NEXT_PUBLIC_API_URL`, defaulting to `https://api.autocurl.lol`). Never put `RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET` in the website environment.

Before live mode: create live plans in the live account, verify the recurring currency and tax/merchant requirements, replace test keys and plan IDs, rotate the webhook secret, register the production webhook URL, and complete a low-value end-to-end payment and cancellation test. Do not activate live payments automatically.
