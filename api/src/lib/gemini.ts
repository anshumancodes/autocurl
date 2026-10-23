import type { ScanRequest, ScanResponse } from '../scan/contracts.js';

function prompt(request: ScanRequest): string {
  return [
    'Return only strict JSON matching {"version":"v1","endpoints":[{"method":string,"path":string,"source":{"file":string,"line":integer},"path_parameters":string[],"headers":object,"body":string,"has_body":boolean,"auth":{"kind":string,"variable":string}|null,"evidence":string[]}]}.',
    'Never invent endpoints. Ground every endpoint in supplied source evidence. Never return secrets or literal credentials.',
    `Operation: ${request.operation}`,
    `Languages: ${request.detection.languages.join(',')}`,
    `Frameworks: ${request.detection.frameworks.join(',')}`,
    `Warnings: ${request.warnings.join(' | ')}`,
    ...request.routes.map((route) => `Existing route: ${route.method} ${route.path} at ${route.source.file}:${route.source.line}`),
    ...request.snippets.map((snippet) => `SOURCE ${snippet.file} lines ${snippet.start}-${snippet.end}:\n${snippet.content}`),
  ].join('\n');
}

export async function analyzeWithGemini(request: ScanRequest, signal: AbortSignal): Promise<ScanResponse> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error('provider not configured');
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST', signal, headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt(request) }] }], generationConfig: { responseMimeType: 'application/json' } }),
  });
  if (!response.ok) throw new Error(`provider status ${response.status}`);
  const envelope = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = envelope.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('provider returned no content');
  return JSON.parse(text.replace(/^```json\s*/, '').replace(/\s*```$/, '')) as ScanResponse;
}
