import type { ApiError } from '../../shared/types';

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function errorJson(code: string, message: string, status = 400): Response {
  const payload: ApiError = { error: { code, message } };
  return json(payload, { status });
}
