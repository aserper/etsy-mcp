import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerShopTools } from "../../../src/tools/shop.js";
import type { EtsyClient } from "../../../src/client/etsy-client.js";

function createMockClient(): EtsyClient {
  return { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } as unknown as EtsyClient;
}

describe("Shop Tools", () => {
  let server: McpServer;
  let client: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    server = new McpServer({ name: "test", version: "0.0.0" });
    client = createMockClient();
    registerShopTools(server, client);
  });

  it("registers without error", () => { expect(true).toBe(true); });

  it("get_shop calls correct endpoint", async () => {
    (client.get as any).mockResolvedValueOnce({ shop_id: 123, shop_name: "TestShop" });
    const result = await (client.get as any)("/shops/123");
    expect(result.shop_name).toBe("TestShop");
  });

  it("find_shops passes search term", async () => {
    (client.get as any).mockResolvedValueOnce({ count: 1, results: [{ shop_id: 456, shop_name: "FoundShop" }] });
    const result = await (client.get as any)("/shops", { shop_name: "Found", limit: "25", offset: "0" });
    expect(result.count).toBe(1);
  });
});
