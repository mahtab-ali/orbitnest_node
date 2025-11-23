import type { OrbitNestConfig, RequestOptions, ApiResult } from '../types';

export class HttpClient {
  private baseUrl: string;
  private apiKey: string;
  private projectSlug: string;
  private timeout: number;

  constructor(config: OrbitNestConfig) {
    this.baseUrl = (config.baseUrl || 'https://api.orbitnest.io').replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.projectSlug = config.projectSlug;
    this.timeout = config.timeout || 30000;
  }

  getProjectSlug(): string {
    return this.projectSlug;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.timeout);

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          data: null,
          error: {
            message: data?.message || data?.error || `Request failed with status ${response.status}`,
            code: data?.code || data?.statusCode?.toString(),
            status: response.status,
          },
        };
      }

      return { data: data as T, error: null };
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof Error && err.name === 'AbortError') {
        return {
          data: null,
          error: { message: 'Request timeout', code: 'TIMEOUT' },
        };
      }

      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : 'Unknown error',
          code: 'NETWORK_ERROR',
        },
      };
    }
  }
}
