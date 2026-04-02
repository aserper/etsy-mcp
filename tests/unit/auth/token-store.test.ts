import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TokenStore } from "../../../src/auth/token-store.js";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("TokenStore", () => {
  let tempDir: string;
  let store: TokenStore;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "etsy-mcp-test-"));
    store = new TokenStore(join(tempDir, "tokens.json"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns null when no tokens stored", async () => {
    const tokens = await store.load();
    expect(tokens).toBeNull();
  });

  it("saves and loads tokens", async () => {
    const tokens = {
      access_token: "test-access",
      refresh_token: "test-refresh",
      expires_at: Date.now() + 3600_000,
    };
    await store.save(tokens);
    const loaded = await store.load();
    expect(loaded).toEqual(tokens);
  });

  it("detects expired access tokens", () => {
    const tokens = {
      access_token: "test",
      refresh_token: "test",
      expires_at: Date.now() - 1000,
    };
    expect(store.isAccessTokenExpired(tokens)).toBe(true);
  });

  it("detects valid access tokens", () => {
    const tokens = {
      access_token: "test",
      refresh_token: "test",
      expires_at: Date.now() + 3600_000,
    };
    expect(store.isAccessTokenExpired(tokens)).toBe(false);
  });

  it("clears stored tokens", async () => {
    await store.save({
      access_token: "test",
      refresh_token: "test",
      expires_at: Date.now() + 3600_000,
    });
    await store.clear();
    const loaded = await store.load();
    expect(loaded).toBeNull();
  });
});
