import type { ApiError } from '@shared/types';

export class ApiClient {
  constructor(private initData: string | null) {}

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (this.initData) {
      headers.set('X-Telegram-InitData', this.initData);
    }
    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    const response = await fetch(path, { ...options, headers });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiError | null;
      const message = payload?.error?.message ?? 'Request failed';
      throw new Error(message);
    }
    return response.json() as Promise<T>;
  }
}
