import { randomUUID } from "node:crypto";
import type { Response } from "express";
import type {
  OAuthServerProvider,
  AuthorizationParams,
} from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import type { OAuthClientInformationFull, OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

/**
 * Single-user OAuth provider for claude.ai's custom-connector flow (which requires
 * a working OAuth/dynamic-client-registration handshake — a plain static bearer
 * header isn't accepted as the primary auth mechanism). Not to be confused with
 * ./oauth.ts, which is Etsy's own OAuth client used to authenticate THIS server
 * against the Etsy API.
 *
 * Auto-approves every authorization request (there is no one else to consent) and
 * always issues the same static access token, matching MCP_AUTH_TOKEN. This makes
 * token verification stateless — it survives Fly's scale-to-zero between calls,
 * since nothing needs to persist across restarts except the fixed token value
 * already held in an env var.
 */
export class SingleUserOAuthProvider implements OAuthServerProvider {
  private clients = new Map<string, OAuthClientInformationFull>();
  private codes = new Map<string, { clientId: string; codeChallenge: string; redirectUri: string }>();

  constructor(private staticAccessToken: string) {}

  get clientsStore(): OAuthRegisteredClientsStore {
    return {
      getClient: (clientId: string) => this.clients.get(clientId),
      registerClient: (client) => {
        const full: OAuthClientInformationFull = {
          ...client,
          client_id: randomUUID(),
          client_id_issued_at: Math.floor(Date.now() / 1000),
        };
        this.clients.set(full.client_id, full);
        return full;
      },
    };
  }

  async authorize(client: OAuthClientInformationFull, params: AuthorizationParams, res: Response): Promise<void> {
    const code = randomUUID();
    this.codes.set(code, { clientId: client.client_id, codeChallenge: params.codeChallenge, redirectUri: params.redirectUri });
    const redirect = new URL(params.redirectUri);
    redirect.searchParams.set("code", code);
    if (params.state) redirect.searchParams.set("state", params.state);
    res.redirect(302, redirect.toString());
  }

  async challengeForAuthorizationCode(_client: OAuthClientInformationFull, authorizationCode: string): Promise<string> {
    const entry = this.codes.get(authorizationCode);
    if (!entry) throw new Error("Invalid authorization code");
    return entry.codeChallenge;
  }

  async exchangeAuthorizationCode(_client: OAuthClientInformationFull, authorizationCode: string): Promise<OAuthTokens> {
    if (!this.codes.has(authorizationCode)) throw new Error("Invalid authorization code");
    this.codes.delete(authorizationCode);
    return {
      access_token: this.staticAccessToken,
      token_type: "bearer",
      refresh_token: this.staticAccessToken,
    };
  }

  async exchangeRefreshToken(): Promise<OAuthTokens> {
    return {
      access_token: this.staticAccessToken,
      token_type: "bearer",
      refresh_token: this.staticAccessToken,
    };
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    if (token !== this.staticAccessToken) throw new Error("Invalid token");
    return { token, clientId: "single-user", scopes: [], expiresAt: Math.floor(Date.now() / 1000) + 100 * 365 * 24 * 60 * 60 };
  }
}
