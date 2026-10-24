# Razorpay test-mode setup

Billing is implemented in the standalone Express service under `api/`. Use Razorpay test mode during development only.

1. Copy `.env.example` to `.env` and set all required variables, including the matching Clerk publishable and secret keys. Keep secret values server-only. V1 uses the existing monthly Razorpay test plan for ₹499/month (`RAZORPAY_CURRENCY=INR`, `PRO_MONTHLY_AMOUNT_MINOR=49900`). Confirm in the Razorpay dashboard that the existing test plan matches these values.
2. Run `npm run db:generate`, then inspect readiness with `npm run db:migrate:status`. Do not reset the database. Apply reviewed migrations in the deployment environment with `npm run db:migrate:deploy` only after approval.
3. Set the existing monthly test plan ID in `RAZORPAY_PLAN_ID_MONTHLY`. Do not create another plan.
4. After deployment, register `POST https://<api-host>/api/webhooks/razorpay` in the Razorpay Test Mode dashboard. Subscribe to `authenticated`, `activated`, `charged`, `pending`, `halted`, `cancelled`, `completed`, and `expired`. Set the dashboard webhook secret to the deployed `RAZORPAY_WEBHOOK_SECRET` value.
5. Do not configure local HTTPS tunnels for this workflow. The signature is calculated over the exact request body; the Express routes intentionally receive raw bodies before `express.json()`.

After deployment, configure Clerk's webhook for `POST https://<api-host>/api/webhooks/clerk` and subscribe to `user.created`, `user.updated`, and `user.deleted`. Set the Clerk signing secret to the deployed `CLERK_WEBHOOK_SECRET` value. Deletion is synchronized as a soft delete so subscriptions and payment history remain available for audit.

The website needs `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_API_URL=https://api.autocurl.lol` for production. Never put `CLERK_SECRET_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, or `DATABASE_URL` in the website environment.

For local development, use `NEXT_PUBLIC_API_URL=http://localhost:8000`,
`WEB_APP_URL=http://localhost:3000`, and `AUTOCURL_API_URL=http://localhost:8000`.
The Go CLI defaults to `https://api.autocurl.lol` when `AUTOCURL_API_URL` is
unset, so production requires no override.

Before live mode: create live plans in the live account, verify the recurring currency and tax/merchant requirements, replace test keys and plan IDs, rotate the webhook secret, register the production webhook URL, and complete a low-value end-to-end payment and cancellation test. Do not activate live payments automatically.
