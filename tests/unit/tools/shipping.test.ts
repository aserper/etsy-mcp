import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerShippingTools } from "../../../src/tools/shipping.js";
import type { EtsyClient } from "../../../src/client/etsy-client.js";

describe("Shipping Tools", () => {
  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const client = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } as unknown as EtsyClient;
    registerShippingTools(server, client);
    expect(true).toBe(true);
  });
});
