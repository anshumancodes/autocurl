export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const requiredServerEnv = [
  'DATABASE_URL',
  'CLERK_SECRET_KEY',
  'CLERK_PUBLISHABLE_KEY',
  'CLERK_WEBHOOK_SECRET',
  'GEMINI_API_KEY',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'RAZORPAY_PLAN_ID_MONTHLY',
  'APP_BASE_URL',
  'WEB_APP_URL',
] as const;

export function validateServerEnv(): void {
  const missing = requiredServerEnv.filter((name) => !process.env[name]?.trim());
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);

  const amount = Number(process.env.PRO_MONTHLY_AMOUNT_MINOR || 49900);
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('PRO_MONTHLY_AMOUNT_MINOR must be a positive integer');

  const origins = process.env.WEB_APP_URL!.split(',').map((value) => value.trim()).filter(Boolean);
  for (const origin of origins) {
    let parsed: URL;
    try { parsed = new URL(origin); } catch { throw new Error(`WEB_APP_URL contains an invalid origin: ${origin}`); }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.pathname !== '/' && parsed.pathname !== '') {
      throw new Error(`WEB_APP_URL contains an invalid origin: ${origin}`);
    }
  }
}

export function allowedWebOrigins(): string[] {
  return (process.env.WEB_APP_URL?.trim() || 'http://localhost:3000')
    .split(',').map((value) => value.trim()).filter(Boolean);
}

export const billingConfig = {
  currency: () => process.env.RAZORPAY_CURRENCY?.trim() || 'INR',
  monthlyAmount: () => Number(process.env.PRO_MONTHLY_AMOUNT_MINOR || 49900),
  keyId: () => requiredEnv('RAZORPAY_KEY_ID'),
  keySecret: () => requiredEnv('RAZORPAY_KEY_SECRET'),
  webhookSecret: () => requiredEnv('RAZORPAY_WEBHOOK_SECRET'),
  monthlyPlanId: () => requiredEnv('RAZORPAY_PLAN_ID_MONTHLY'),
  appBaseUrl: () => requiredEnv('APP_BASE_URL'),
};

export const authConfig = {
  clerkWebhookSecret: () => requiredEnv('CLERK_WEBHOOK_SECRET'),
  cliSessionTtlMs: () => Number(process.env.CLI_SESSION_TTL_MS || 30 * 24 * 60 * 60 * 1000),
  cliAuthorizationUrl: () => process.env.CLI_AUTHORIZATION_URL?.trim() || 'https://autocurl.lol/cli/authorize',
};
