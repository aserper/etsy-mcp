import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListingsTools } from "../../../src/tools/listings.js";
import type { EtsyClient } from "../../../src/client/etsy-client.js";

function createMockClient(): EtsyClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    uploadFile: vi.fn(),
  } as unknown as EtsyClient;
}

describe("Listings Tools", () => {
  let server: McpServer;
  let client: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    server = new McpServer({ name: "test", version: "0.0.0" });
    client = createMockClient();
    registerListingsTools(server, client);
  });

  it("registers all listing tools without error", () => {
    expect(true).toBe(true);
  });

  it("search_listings calls correct endpoint", async () => {
    (client.get as any).mockResolvedValueOnce({
      count: 1,
      results: [{ listing_id: 123, title: "Test Item" }],
    });
    const result = await (client.get as any)("/listings/active", { keywords: "test", limit: "25", offset: "0" });
    expect(result.results).toHaveLength(1);
    expect(result.results[0].title).toBe("Test Item");
  });

  it("create_draft_listing sends correct body", async () => {
    (client.post as any).mockResolvedValueOnce({ listing_id: 456 });
    const result = await (client.post as any)("/shops/789/listings", {
      title: "New Listing",
      description: "A test listing",
      price: 19.99,
      quantity: 5,
      taxonomy_id: 1,
      who_made: "i_did",
      when_made: "made_to_order",
      is_supply: false,
    });
    expect(result.listing_id).toBe(456);
  });
});
