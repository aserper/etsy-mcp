import { EtsyApiError } from "../utils/errors.js";

const BASE_URL = "https://openapi.etsy.com/v3/application";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export { EtsyApiError } from "../utils/errors.js";

export interface EtsyClientConfig {
  apiKey: string;
  sharedSecret: string;
  getAccessToken: () => Promise<string | null>;
  onTokenExpired: () => Promise<void>;
}

export class EtsyClient {
  private config: EtsyClientConfig;
  private lastRequestTime = 0;
  private minRequestInterval = 100; // 10 req/sec

  constructor(config: EtsyClientConfig) {
    this.config = config;
  }

  async get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>("GET", path, undefined, params);
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  async patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  async delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  async uploadFile<T = unknown>(path: string, formData: FormData): Promise<T> {
    return this.request<T>("POST", path, formData, undefined, true);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
    isFormData = false
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }

      await this.rateLimit();

      const url = new URL(`${BASE_URL}${path}`);
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          url.searchParams.set(key, value);
        }
      }

      const token = await this.config.getAccessToken();
      const headers: Record<string, string> = {
        "x-api-key": `${this.config.apiKey}:${this.config.sharedSecret}`,
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      if (body && !isFormData) {
        headers["Content-Type"] = "application/json";
      }

      const fetchOptions: RequestInit = { method, headers };
      if (body) {
        fetchOptions.body = isFormData ? (body as FormData) : JSON.stringify(body);
      }

      try {
        const response = await fetch(url.toString(), fetchOptions);

        if (response.ok) {
          if (response.status === 204) return null as T;
          return (await response.json()) as T;
        }

        if (response.status === 401 && attempt === 0) {
          await this.config.onTokenExpired();
          continue;
        }

        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          if (retryAfter) {
            await new Promise((r) => setTimeout(r, parseInt(retryAfter, 10) * 1000));
          }
          continue;
        }

        if (response.status >= 500) {
          lastError = new EtsyApiError(response.status, await response.json().catch(() => null));
          continue;
        }

        const errorBody = await response.json().catch(() => null);
        throw new EtsyApiError(response.status, errorBody);
      } catch (err) {
        if (err instanceof EtsyApiError) throw err;
        lastError = err as Error;
        if (attempt === MAX_RETRIES) throw lastError;
      }
    }

    throw lastError ?? new Error("Request failed after retries");
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minRequestInterval) {
      await new Promise((r) => setTimeout(r, this.minRequestInterval - elapsed));
    }
    this.lastRequestTime = Date.now();
  }
}
