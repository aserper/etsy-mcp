#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TokenStore } from "./auth/token-store.js";
import { OAuthClient } from "./auth/oauth.js";
import { AuthManager } from "./auth/auth-manager.js";
import { EtsyClient } from "./client/etsy-client.js";
import { registerListingsTools } from "./tools/listings.js";
import { registerShopTools } from "./tools/shop.js";
import { registerOrdersTools } from "./tools/orders.js";
import { registerTransactionsTools } from "./tools/transactions.js";
import { registerShippingTools } from "./tools/shipping.js";
import { registerReviewsTools } from "./tools/reviews.js";
import { registerUsersTools } from "./tools/users.js";
import { registerTaxonomyTools } from "./tools/taxonomy.js";
import { registerImagesTools } from "./tools/images.js";
import { registerInventoryTools } from "./tools/inventory.js";
import { registerPaymentsTools } from "./tools/payments.js";
import { registerReturnPoliciesTools } from "./tools/return-policies.js";
import { join } from "node:path";
import { homedir } from "node:os";

const ALL_SCOPES = [
  "address_r", "address_w", "billing_r", "cart_r", "cart_w",
  "email_r", "favorites_r", "favorites_w", "feedback_r",
  "listings_d", "listings_r", "listings_w",
  "profile_r", "profile_w", "recommend_r", "recommend_w",
  "shops_r", "shops_w", "transactions_r", "transactions_w",
];

export interface ServerConfig {
  apiKey: string;
  sharedSecret: string;
  tokenStorePath?: string;
  scopes?: string[];
}

export function createEtsyMcpServer(config: ServerConfig): McpServer {
  const server = new McpServer({
    name: "etsy-mcp",
    version: "1.0.0",
  });

  const tokenStorePath =
    config.tokenStorePath ?? join(homedir(), ".etsy-mcp", "tokens.json");

  const tokenStore = new TokenStore(tokenStorePath);
  const oauthClient = new OAuthClient({
    apiKey: config.apiKey,
    sharedSecret: config.sharedSecret,
    scopes: config.scopes ?? ALL_SCOPES,
  });
  const authManager = new AuthManager(tokenStore, oauthClient);

  const client = new EtsyClient({
    apiKey: config.apiKey,
    sharedSecret: config.sharedSecret,
    getAccessToken: () => authManager.getAccessToken(),
    onTokenExpired: () => authManager.handleTokenExpired(),
  });

  server.registerTool(
    "authenticate",
    {
      description: "Authenticate with Etsy via OAuth 2.0. Opens a browser for consent. Required before using tools that need user authorization.",
    },
    async () => {
      const token = await authManager.authenticate();
      return {
        content: [{
          type: "text" as const,
          text: token ? "Successfully authenticated with Etsy!" : "Authentication failed.",
        }],
      };
    }
  );

  registerListingsTools(server, client);
  registerShopTools(server, client);
  registerOrdersTools(server, client);
  registerTransactionsTools(server, client);
  registerShippingTools(server, client);
  registerReviewsTools(server, client);
  registerUsersTools(server, client);
  registerTaxonomyTools(server, client);
  registerImagesTools(server, client);
  registerInventoryTools(server, client);
  registerPaymentsTools(server, client);
  registerReturnPoliciesTools(server, client);

  return server;
}

// CLI entry point - only run when executed directly
const isDirectRun = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));

if (isDirectRun) {
  const apiKey = process.env.ETSY_API_KEY;
  const sharedSecret = process.env.ETSY_SHARED_SECRET;

  if (!apiKey || !sharedSecret) {
    console.error("Error: ETSY_API_KEY and ETSY_SHARED_SECRET environment variables are required.");
    console.error("See .env.example for the expected format.");
    process.exit(1);
  }

  const server = createEtsyMcpServer({ apiKey, sharedSecret });
  const transport = new StdioServerTransport();
  server.connect(transport).catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
