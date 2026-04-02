import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTransactionsTools } from "../../../src/tools/transactions.js";
import type { EtsyClient } from "../../../src/client/etsy-client.js";

describe("Transactions Tools", () => {
  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const client = { get: vi.fn() } as unknown as EtsyClient;
    registerTransactionsTools(server, client);
    expect(true).toBe(true);
  });
});
