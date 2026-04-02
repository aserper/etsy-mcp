import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerImagesTools } from "../../../src/tools/images.js";
import type { EtsyClient } from "../../../src/client/etsy-client.js";

describe("Images Tools", () => {
  it("registers without error", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const client = { get: vi.fn(), post: vi.fn(), delete: vi.fn(), uploadFile: vi.fn() } as unknown as EtsyClient;
    registerImagesTools(server, client);
    expect(true).toBe(true);
  });
});
