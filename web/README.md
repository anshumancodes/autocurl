## Website for autocurl CLI

### Environment

The website only receives public Clerk/Razorpay configuration:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key for this website.
- `NEXT_PUBLIC_API_URL`: standalone Express API URL.
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Razorpay public checkout key.

Use `NEXT_PUBLIC_API_URL=http://localhost:8000` locally. Set
`NEXT_PUBLIC_API_URL=https://api.autocurl.lol` for production builds. These are
public build-time values; do not place server credentials in the website env.

Keep `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, Razorpay secrets, and Gemini
credentials in the Express API environment (`api/.env`); they must never be
exposed to this Next.js app or the CLI.

