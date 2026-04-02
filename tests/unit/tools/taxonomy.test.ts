import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTaxonomyTools } from "../../../src/tools/taxonomy.js";
import type { EtsyClient } from "../../../src/client/etsy-client.js";

describe("Taxonomy Tools", () => {
  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const client = { get: vi.fn() } as unknown as EtsyClient;
    registerTaxonomyTools(server, client);
    expect(true).toBe(true);
  });
});
