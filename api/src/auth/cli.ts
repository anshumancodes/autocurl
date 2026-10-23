import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../lib/db.js';
import { ApiError, sendError } from '../lib/errors.js';
import { authConfig } from '../lib/config.js';
import { syncClerkUser } from './users.js';

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const token = () => `aclt_${crypto.randomBytes(32).toString('base64url')}`;

function validRedirect(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try { return new URL(value).protocol === 'http:' && new URL(value).hostname === '127.0.0.1'; } catch { return false; }
}

export async function postCliExchange(req: Request, res: Response): Promise<void> {
  try {
    const auth = getAuth(req);
    if (!auth.isAuthenticated || !auth.userId) throw new ApiError(401, 'authentication_required', 'Sign in to connect autocurl.');
    const redirectUri = req.body?.redirect_uri;
    const state = typeof req.body?.state === 'string' ? req.body.state : '';
    if (!state || !validRedirect(redirectUri)) throw new ApiError(400, 'invalid_request', 'Invalid CLI authorization request.');
    const user = await syncClerkUser({ id: auth.userId });
    const raw = token();
    await prisma.cliSession.create({ data: { userId: user.id, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + authConfig.cliSessionTtlMs()) } });
    const callback = new URL(redirectUri);
    callback.searchParams.set('code', raw);
    callback.searchParams.set('state', state);
    res.json({ redirect: callback.toString() });
  } catch (error) { if (error instanceof ApiError) sendError(res, error); else sendError(res, new ApiError(500, 'internal_error', 'CLI authorization failed.')); }
}

export async function postCliRevoke(req: Request, res: Response): Promise<void> {
  const header = req.header('Authorization') || '';
  const raw = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (raw) await prisma.cliSession.updateMany({ where: { tokenHash: hashToken(raw), revokedAt: null }, data: { revokedAt: new Date() } });
  res.status(204).end();
}

export async function requireCliSession(req: Request, res: Response, next: () => void): Promise<void> {
  const header = req.header('Authorization') || '';
  const raw = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!raw) { sendError(res, new ApiError(401, 'authentication_required', 'Run autocurl login to use managed AI scans.')); return; }
  const session = await prisma.cliSession.findFirst({ where: { tokenHash: hashToken(raw), revokedAt: null, expiresAt: { gt: new Date() } }, include: { user: true } });
  if (!session || session.user.deletedAt) { sendError(res, new ApiError(401, 'authentication_required', 'Your CLI session has expired. Run autocurl login again.')); return; }
  await prisma.cliSession.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } });
  req.authenticatedUserId = session.user.clerkUserId;
  next();
}

declare global { namespace Express { interface Request { authenticatedUserId?: string } } }
