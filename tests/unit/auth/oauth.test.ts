import { describe, it, expect, vi, beforeEach } from "vitest";
import { OAuthClient } from "../../../src/auth/oauth.js";

describe("OAuthClient", () => {
  let client: OAuthClient;

  beforeEach(() => {
    client = new OAuthClient({
      apiKey: "test-key",
      sharedSecret: "test-secret",
      scopes: ["listings_r", "shops_r"],
    });
  });

  it("generates a valid PKCE code verifier", () => {
    const verifier = client.generateCodeVerifier();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
  });

  it("generates a valid PKCE code challenge from verifier", async () => {
    const verifier = client.generateCodeVerifier();
    const challenge = await client.generateCodeChallenge(verifier);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(challenge.length).toBeGreaterThan(0);
  });

  it("builds a correct authorization URL", async () => {
    const { url, codeVerifier, state } = await client.buildAuthorizationUrl(
      "http://localhost:9999/callback"
    );
    expect(url).toContain("https://www.etsy.com/oauth/connect");
    expect(url).toContain("response_type=code");
    expect(url).toContain("client_id=test-key");
    expect(url).toContain("redirect_uri=http%3A%2F%2Flocalhost%3A9999%2Fcallback");
    expect(url).toContain("scope=listings_r%20shops_r");
    expect(url).toContain("code_challenge_method=S256");
    expect(codeVerifier).toBeTruthy();
    expect(state).toBeTruthy();
  });

  it("exchanges auth code for tokens", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: "new-access",
          refresh_token: "new-refresh",
          expires_in: 3600,
        }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const tokens = await client.exchangeCode(
      "auth-code",
      "code-verifier",
      "http://localhost:9999/callback"
    );

    expect(tokens.access_token).toBe("new-access");
    expect(tokens.refresh_token).toBe("new-refresh");
    expect(tokens.expires_at).toBeGreaterThan(Date.now());
    expect(mockFetch).toHaveBeenCalledOnce();

    vi.unstubAllGlobals();
  });

  it("refreshes an access token", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: "refreshed-access",
          refresh_token: "refreshed-refresh",
          expires_in: 3600,
        }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const tokens = await client.refreshAccessToken("old-refresh");

    expect(tokens.access_token).toBe("refreshed-access");
    expect(tokens.refresh_token).toBe("refreshed-refresh");

    vi.unstubAllGlobals();
  });
});
