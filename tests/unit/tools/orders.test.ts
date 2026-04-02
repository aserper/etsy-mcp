import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerOrdersTools } from "../../../src/tools/orders.js";
import type { EtsyClient } from "../../../src/client/etsy-client.js";

describe("Orders Tools", () => {
  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const client = { get: vi.fn(), post: vi.fn(), put: vi.fn() } as unknown as EtsyClient;
    registerOrdersTools(server, client);
    expect(true).toBe(true);
  });
});
