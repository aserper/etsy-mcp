import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPaymentsTools } from "../../../src/tools/payments.js";
import type { EtsyClient } from "../../../src/client/etsy-client.js";

describe("Payments Tools", () => {
  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const client = { get: vi.fn() } as unknown as EtsyClient;
    registerPaymentsTools(server, client);
    expect(true).toBe(true);
  });
});
