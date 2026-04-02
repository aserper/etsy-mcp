import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerInventoryTools } from "../../../src/tools/inventory.js";
import type { EtsyClient } from "../../../src/client/etsy-client.js";

describe("Inventory Tools", () => {
  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const client = { get: vi.fn(), put: vi.fn() } as unknown as EtsyClient;
    registerInventoryTools(server, client);
    expect(true).toBe(true);
  });
});
