import type { Request } from 'express';

export function hasClerkCredentials(req: Pick<Request, 'header'>): boolean {
  const authorization = req.header('Authorization')?.trim();
  const cookie = req.header('Cookie') || '';
  return Boolean(authorization || /(?:^|;\s*)__session=[^;]+/.test(cookie));
}
