import { join } from "node:path";
import { homedir } from "node:os";
import { OAuthClient } from "../dist/auth/oauth.js";
import { TokenStore } from "../dist/auth/token-store.js";

const ALL_SCOPES = [
  "address_r", "address_w", "billing_r", "cart_r", "cart_w",
  "email_r", "favorites_r", "favorites_w", "feedback_r",
  "listings_d", "listings_r", "listings_w",
  "profile_r", "profile_w", "recommend_r", "recommend_w",
  "shops_r", "shops_w", "transactions_r", "transactions_w",
];

const apiKey = process.env.ETSY_API_KEY;
const sharedSecret = process.env.ETSY_SHARED_SECRET;

if (!apiKey || !sharedSecret) {
  console.error("Missing ETSY_API_KEY / ETSY_SHARED_SECRET in environment.");
  process.exit(1);
}

const tokenPath = join(homedir(), ".etsy-mcp", "tokens.json");
const store = new TokenStore(tokenPath);
const client = new OAuthClient({ apiKey, sharedSecret, scopes: ALL_SCOPES });

console.log("Opening browser for Etsy OAuth consent...");

try {
  const { code, redirectUri, codeVerifier } = await client.startLocalAuthFlow();
  const tokens = await client.exchangeCode(code, codeVerifier, redirectUri);
  await store.save(tokens);
  console.log("\nAuthenticated successfully. Tokens saved to:", tokenPath);
} catch (err) {
  console.error("\nAuthentication failed:", err.message);
  process.exit(1);
}
