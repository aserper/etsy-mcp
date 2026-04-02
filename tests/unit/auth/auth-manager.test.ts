import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthManager } from "../../../src/auth/auth-manager.js";
import type { TokenStore, StoredTokens } from "../../../src/auth/token-store.js";
import type { OAuthClient } from "../../../src/auth/oauth.js";

function createMockTokenStore(): TokenStore {
  let stored: StoredTokens | null = null;
  return {
    load: vi.fn(async () => stored),
    save: vi.fn(async (tokens: StoredTokens) => { stored = tokens; }),
    clear: vi.fn(async () => { stored = null; }),
    isAccessTokenExpired: vi.fn((tokens: StoredTokens) => Date.now() >= tokens.expires_at),
    filePath: "/tmp/test-tokens.json",
  } as unknown as TokenStore;
}

function createMockOAuthClient(): OAuthClient {
  return {
    refreshAccessToken: vi.fn(async () => ({
      access_token: "refreshed-token",
      refresh_token: "new-refresh",
      expires_at: Date.now() + 3600_000,
    })),
    startLocalAuthFlow: vi.fn(async () => ({
      code: "test-code",
      redirectUri: "http://localhost:1234/callback",
      codeVerifier: "test-verifier",
    })),
    exchangeCode: vi.fn(async () => ({
      access_token: "new-token",
      refresh_token: "new-refresh",
      expires_at: Date.now() + 3600_000,
    })),
  } as unknown as OAuthClient;
}

describe("AuthManager", () => {
  let manager: AuthManager;
  let tokenStore: ReturnType<typeof createMockTokenStore>;
  let oauthClient: ReturnType<typeof createMockOAuthClient>;

  beforeEach(() => {
    tokenStore = createMockTokenStore();
    oauthClient = createMockOAuthClient();
    manager = new AuthManager(tokenStore, oauthClient);
  });

  it("returns null when no tokens exist", async () => {
    const token = await manager.getAccessToken();
    expect(token).toBeNull();
  });

  it("returns valid stored token", async () => {
    const validTokens: StoredTokens = {
      access_token: "valid-token",
      refresh_token: "refresh",
      expires_at: Date.now() + 3600_000,
    };
    await tokenStore.save(validTokens);
    const token = await manager.getAccessToken();
    expect(token).toBe("valid-token");
  });

  it("refreshes expired token automatically", async () => {
    const expiredTokens: StoredTokens = {
      access_token: "expired",
      refresh_token: "still-valid-refresh",
      expires_at: Date.now() - 1000,
    };
    await tokenStore.save(expiredTokens);
    const token = await manager.getAccessToken();
    expect(token).toBe("refreshed-token");
    expect(oauthClient.refreshAccessToken).toHaveBeenCalledWith("still-valid-refresh");
  });

  it("handleTokenExpired triggers refresh", async () => {
    const tokens: StoredTokens = {
      access_token: "old",
      refresh_token: "valid-refresh",
      expires_at: Date.now() + 3600_000,
    };
    await tokenStore.save(tokens);
    await manager.handleTokenExpired();
    expect(oauthClient.refreshAccessToken).toHaveBeenCalledWith("valid-refresh");
  });
});
