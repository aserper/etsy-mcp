import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EtsyClient, EtsyApiError } from "../../../src/client/etsy-client.js";

describe("EtsyClient", () => {
  let client: EtsyClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
    client = new EtsyClient({
      apiKey: "test-key",
      sharedSecret: "test-secret",
      getAccessToken: async () => "test-token",
      onTokenExpired: async () => {},
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("makes GET requests with correct headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ count: 1, results: [{ id: 123 }] }),
    });

    const result = await client.get("/listings/active", { limit: "10" });
    expect(result).toEqual({ count: 1, results: [{ id: 123 }] });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://openapi.etsy.com/v3/application/listings/active?limit=10");
    expect(options.headers["Authorization"]).toBe("Bearer test-token");
    expect(options.headers["x-api-key"]).toBe("test-key:test-secret");
  });

  it("makes POST requests with JSON body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ listing_id: 456 }),
    });

    const result = await client.post("/shops/123/listings", {
      title: "Test",
      quantity: 1,
    });

    expect(result).toEqual({ listing_id: 456 });
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ title: "Test", quantity: 1 });
  });

  it("throws EtsyApiError on 400 responses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Invalid input" }),
    });

    await expect(client.get("/listings/999")).rejects.toThrow(EtsyApiError);
  });

  it("retries on 429 with backoff", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ "Retry-After": "1" }),
        json: () => Promise.resolve({ error: "Rate limited" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

    const result = await client.get("/listings/active");
    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("retries on 500 errors", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ recovered: true }),
      });

    const result = await client.get("/listings/active");
    expect(result).toEqual({ recovered: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("calls onTokenExpired and retries on 401", async () => {
    const onTokenExpired = vi.fn().mockResolvedValue(undefined);
    client = new EtsyClient({
      apiKey: "test-key",
      sharedSecret: "test-secret",
      getAccessToken: async () => "refreshed-token",
      onTokenExpired,
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "Unauthorized" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ authed: true }),
      });

    const result = await client.get("/users/me");
    expect(result).toEqual({ authed: true });
    expect(onTokenExpired).toHaveBeenCalledOnce();
  });

  it("makes DELETE requests", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.resolve(null),
      text: () => Promise.resolve(""),
    });

    await client.delete("/listings/123");
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("DELETE");
  });

  it("makes PUT requests", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ updated: true }),
    });

    const result = await client.put("/shops/123", { title: "Updated" });
    expect(result).toEqual({ updated: true });
  });
});
