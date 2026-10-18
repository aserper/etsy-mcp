import { join } from "node:path";
import { homedir } from "node:os";
import { TokenStore } from "../dist/auth/token-store.js";
import { OAuthClient } from "../dist/auth/oauth.js";
import { AuthManager } from "../dist/auth/auth-manager.js";
import { EtsyClient } from "../dist/client/etsy-client.js";

const apiKey = process.env.ETSY_API_KEY;
const sharedSecret = process.env.ETSY_SHARED_SECRET;
const tokenStore = new TokenStore(join(homedir(), ".etsy-mcp", "tokens.json"));
const oauthClient = new OAuthClient({ apiKey, sharedSecret, scopes: [] });
const authManager = new AuthManager(tokenStore, oauthClient);
const client = new EtsyClient({
  apiKey,
  sharedSecret,
  getAccessToken: () => authManager.getAccessToken(),
  onTokenExpired: () => authManager.handleTokenExpired(),
});

const me = await client.get("/users/me");
console.log("me:", JSON.stringify(me, null, 2));

const shopsResp = await client.get(`/users/${me.user_id}/shops`);
console.log("\nshop:", JSON.stringify({ shop_id: shopsResp.shop_id, shop_name: shopsResp.shop_name, listing_active_count: shopsResp.listing_active_count }, null, 2));

const shopId = shopsResp.shop_id;
const listings = await client.get(`/shops/${shopId}/listings?state=active&limit=5`);
console.log("\nactive listings count:", listings.count, "sample:", listings.results?.slice(0,3).map(l => ({id: l.listing_id, title: l.title})));

const receipts = await client.get(`/shops/${shopId}/receipts?limit=5`);
console.log("\nreceipts count:", receipts.count);
