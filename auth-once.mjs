import { OAuthClient } from "./dist/auth/oauth.js";
import { TokenStore } from "./dist/auth/token-store.js";
import { homedir } from "node:os";
import { join } from "node:path";

const API_KEY = "8j9i568doirbqivx2f1pqjsb";
const SHARED_SECRET = "q5sdpb1jrq";

const tokenPath = join(homedir(), ".etsy-mcp", "tokens.json");
const store = new TokenStore(tokenPath);
const client = new OAuthClient({
  apiKey: API_KEY,
  sharedSecret: SHARED_SECRET,
  scopes: [
    "listings_r", "listings_w", "listings_d",
    "shops_r", "shops_w",
    "transactions_r", "transactions_w",
    "billing_r", "profile_r", "address_r", "address_w",
    "email_r", "favorites_r", "favorites_w",
    "feedback_r"
  ]
});

console.log("Opening browser for Etsy OAuth...");
console.log("Please approve access in the browser window.\n");

try {
  const { code, redirectUri, codeVerifier } = await client.startLocalAuthFlow();
  const tokens = await client.exchangeCode(code, redirectUri, codeVerifier);
  await store.save(tokens);
  console.log("\n✅ Authentication successful! Tokens saved to:", tokenPath);
} catch (e) {
  console.error("\n❌ Error:", e.message);
}
process.exit(0);
