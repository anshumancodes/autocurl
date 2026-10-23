export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const billingConfig = {
  currency: () => process.env.RAZORPAY_CURRENCY?.trim() || 'INR',
  monthlyAmount: () => Number(process.env.PRO_MONTHLY_AMOUNT_MINOR || 499),
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
