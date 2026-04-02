import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerReturnPoliciesTools } from "../../../src/tools/return-policies.js";
import type { EtsyClient } from "../../../src/client/etsy-client.js";

describe("Return Policies Tools", () => {
  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const client = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } as unknown as EtsyClient;
    registerReturnPoliciesTools(server, client);
    expect(true).toBe(true);
  });
});
