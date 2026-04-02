import { describe, it, expect } from "vitest";

describe("Etsy API Ping (integration)", () => {
  it("can reach the Etsy API ping endpoint", async () => {
    const apiKey = process.env.ETSY_API_KEY;
    if (!apiKey) {
      console.log("Skipping integration test: ETSY_API_KEY not set");
      return;
    }

    const response = await fetch(
      "https://openapi.etsy.com/v3/application/openapi-ping",
      { headers: { "x-api-key": apiKey } }
    );

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty("application_id");
  });
});
