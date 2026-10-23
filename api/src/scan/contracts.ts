export const API_VERSION = 'v1';

export type SourceLocation = { file: string; line: number };
export type AuthMetadata = { kind: string; variable: string } | null;
export type Route = {
  method: string;
  path: string;
  source: SourceLocation;
  headers?: Record<string, string>;
  body?: string;
  has_body?: boolean;
  auth?: AuthMetadata;
};
export type SourceSnippet = { file: string; start: number; end: number; content: string };
export type ScanRequest = {
  version: typeof API_VERSION;
  operation: string;
  detection: { languages: string[]; frameworks: string[] };
  routes: Route[];
  warnings: string[];
  snippets: SourceSnippet[];
  request_id: string;
};
export type ScanResponse = {
  version: typeof API_VERSION;
  endpoints: Array<Route & { path_parameters: string[]; evidence: string[] }>;
};

const MAX_BYTES = 48 * 1024;
const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
const PLACEHOLDER = /^\{\{[A-Za-z_][A-Za-z0-9_]*\}\}$/;

export function validateScanRequest(value: unknown): ScanRequest {
  if (!value || typeof value !== 'object') throw new Error('request must be an object');
  const input = value as Partial<ScanRequest>;
  if (input.version !== API_VERSION || typeof input.operation !== 'string' || input.operation.length > 80) throw new Error('invalid version or operation');
  if (!Array.isArray(input.routes) || !Array.isArray(input.warnings) || !Array.isArray(input.snippets)) throw new Error('invalid arrays');
  if (typeof input.request_id !== 'string' || !/^[A-Za-z0-9._:-]{8,128}$/.test(input.request_id)) throw new Error('invalid request_id');
  const detection = input.detection;
  if (!detection || !Array.isArray(detection.languages) || !Array.isArray(detection.frameworks)) throw new Error('invalid detection');
  if (JSON.stringify(value).length > MAX_BYTES) throw new Error('payload too large');
  for (const route of input.routes) {
    if (!route || typeof route !== 'object' || typeof route.method !== 'string' || !METHODS.has(route.method.toUpperCase()) || typeof route.path !== 'string' || route.path.length > 2048) throw new Error('invalid route');
  }
  for (const snippet of input.snippets) {
    if (!snippet || typeof snippet.file !== 'string' || snippet.file.startsWith('/') || snippet.file.includes('..') || typeof snippet.content !== 'string' || snippet.content.length > 12 * 1024) throw new Error('invalid snippet');
  }
  return input as ScanRequest;
}

export function validateScanResponse(value: unknown): ScanResponse {
  if (!value || typeof value !== 'object' || (value as ScanResponse).version !== API_VERSION || !Array.isArray((value as ScanResponse).endpoints)) throw new Error('invalid provider response');
  const response = value as ScanResponse;
  for (const endpoint of response.endpoints) {
    if (!METHODS.has(endpoint.method?.toUpperCase()) || !endpoint.path || !endpoint.source?.file || endpoint.source.line < 1 || !Array.isArray(endpoint.path_parameters) || !Array.isArray(endpoint.evidence)) throw new Error('invalid provider endpoint');
    if (endpoint.headers) for (const [name, value] of Object.entries(endpoint.headers)) {
      if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name) || /[\r\n]/.test(value) || /(secret|token|password|api[_-]?key)/i.test(value) && !PLACEHOLDER.test(value)) throw new Error('provider response contains unsafe header');
    }
    if (endpoint.body && endpoint.body.length > 16 * 1024 || /\r|\0/.test(endpoint.body ?? '')) throw new Error('invalid provider body');
  }
  return response;
}
