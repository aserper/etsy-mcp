import { createHash, randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { StoredTokens } from "./token-store.js";

const ETSY_AUTH_URL = "https://www.etsy.com/oauth/connect";
const ETSY_TOKEN_URL = "https://api.etsy.com/v3/public/oauth/token";

export interface OAuthConfig {
  apiKey: string;
  sharedSecret: string;
  scopes: string[];
}

export class OAuthClient {
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  generateCodeVerifier(): string {
    return randomBytes(32).toString("base64url");
  }

  async generateCodeChallenge(verifier: string): Promise<string> {
    const hash = createHash("sha256").update(verifier).digest();
    return hash.toString("base64url");
  }

  async buildAuthorizationUrl(
    redirectUri: string
  ): Promise<{ url: string; codeVerifier: string; state: string }> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const state = randomBytes(16).toString("hex");

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.config.apiKey,
      redirect_uri: redirectUri,
      scope: this.config.scopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return {
      url: `${ETSY_AUTH_URL}?${params.toString().replace(/\+/g, "%20")}`,
      codeVerifier,
      state,
    };
  }

  async exchangeCode(
    code: string,
    codeVerifier: string,
    redirectUri: string
  ): Promise<StoredTokens> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: this.config.apiKey,
      redirect_uri: redirectUri,
      code,
      code_verifier: codeVerifier,
    });

    const response = await fetch(ETSY_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Token exchange failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<StoredTokens> {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: this.config.apiKey,
      refresh_token: refreshToken,
    });

    const response = await fetch(ETSY_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Token refresh failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
    };
  }

  async startLocalAuthFlow(): Promise<{ code: string; redirectUri: string; codeVerifier: string }> {
    return new Promise((resolve, reject) => {
      // Generate PKCE verifier and state before starting the server
      // to avoid race conditions with the callback handler
      let expectedState: string;
      let codeVerifier: string;
      // Remember the redirect URI chosen in listen(): server.address() returns null
      // after server.close(), so it must not be read in the callback handler.
      let redirectUri: string;

      const server = createServer(
        (req: IncomingMessage, res: ServerResponse) => {
          const url = new URL(req.url!, `http://localhost`);
          const code = url.searchParams.get("code");
          const returnedState = url.searchParams.get("state");

          if (!code) {
            res.writeHead(400, { "Content-Type": "text/html" });
            res.end("<html><body><h1>Authorization failed</h1></body></html>");
            server.close();
            reject(new Error(`OAuth callback missing code. State: ${returnedState}`));
            return;
          }

          if (returnedState !== expectedState) {
            res.writeHead(403, { "Content-Type": "text/html" });
            res.end("<html><body><h1>State mismatch — possible CSRF attack</h1></body></html>");
            server.close();
            reject(new Error("OAuth state mismatch: possible CSRF attack"));
            return;
          }

          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(
            "<html><body><h1>Authorization successful!</h1><p>You can close this window.</p></body></html>"
          );
          server.close();
          resolve({ code, redirectUri, codeVerifier });
        }
      );

      server.on("error", (err) => {
        reject(err);
      });

      server.listen(0, async () => {
        try {
          const port = (server.address() as any).port;
          redirectUri = `http://localhost:${port}/callback`;
          const authData = await this.buildAuthorizationUrl(redirectUri);
          codeVerifier = authData.codeVerifier;
          expectedState = authData.state;

          console.error(`\nOpen this URL to authorize:\n${authData.url}\n`);
          const { default: open } = await import("open");
          await open(authData.url);
        } catch (err) {
          // An unhandled rejection here would take down the whole MCP process.
          server.close();
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });

      setTimeout(() => {
        server.close();
        reject(new Error("OAuth flow timed out after 120 seconds"));
      }, 120_000);
    });
  }
}
