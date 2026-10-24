import type { ErrorRequestHandler, Response } from 'express';

export type ApiErrorCode =
  | 'authentication_required'
  | 'upgrade_required'
  | 'quota_exceeded'
  | 'invalid_request'
  | 'provider_unavailable'
  | 'internal_error';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export function sendError(res: Response, error: ApiError): void {
  res.status(error.status).json({ error: { code: error.code, message: error.message } });
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ApiError) {
    sendError(res, error);
    return;
  }
  if (process.env.NODE_ENV !== 'production') {
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error(`Unhandled API error for ${req.method} ${req.originalUrl}: ${detail}`);
  } else {
    console.error('Unhandled API error');
  }
  sendError(res, new ApiError(500, 'internal_error', 'An internal error occurred.'));
};
