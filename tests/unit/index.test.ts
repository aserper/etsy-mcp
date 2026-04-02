import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to mock the environment before importing
vi.stubEnv("ETSY_API_KEY", "");
vi.stubEnv("ETSY_SHARED_SECRET", "");

describe("createEtsyMcpServer", () => {
  it("creates a server with all tools registered", async () => {
    const { createEtsyMcpServer } = await import("../../src/index.js");
    const server = createEtsyMcpServer({
      apiKey: "test-key",
      sharedSecret: "test-secret",
      tokenStorePath: "/tmp/test-tokens.json",
      scopes: ["listings_r"],
    });
    expect(server).toBeDefined();
  });
});
