import type { TokenStore, StoredTokens } from "./token-store.js";
import type { OAuthClient } from "./oauth.js";

export class AuthManager {
  constructor(
    private tokenStore: TokenStore,
    private oauthClient: OAuthClient
  ) {}

  async getAccessToken(): Promise<string | null> {
    const tokens = await this.tokenStore.load();
    if (!tokens) return null;

    if (!this.tokenStore.isAccessTokenExpired(tokens)) {
      return tokens.access_token;
    }

    try {
      const refreshed = await this.oauthClient.refreshAccessToken(tokens.refresh_token);
      await this.tokenStore.save(refreshed);
      return refreshed.access_token;
    } catch {
      return null;
    }
  }

  async handleTokenExpired(): Promise<void> {
    const tokens = await this.tokenStore.load();
    if (!tokens) return;

    try {
      const refreshed = await this.oauthClient.refreshAccessToken(tokens.refresh_token);
      await this.tokenStore.save(refreshed);
    } catch {
      await this.tokenStore.clear();
    }
  }

  async authenticate(): Promise<string> {
    const existing = await this.getAccessToken();
    if (existing) return existing;

    const { code, redirectUri, codeVerifier } = await this.oauthClient.startLocalAuthFlow();
    const tokens = await this.oauthClient.exchangeCode(code, codeVerifier, redirectUri);
    await this.tokenStore.save(tokens);
    return tokens.access_token;
  }
}
