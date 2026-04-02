import { describe, it, expect } from "vitest";
import { paginationParams, formatPaginatedResponse } from "../../../src/utils/pagination.js";

describe("paginationParams", () => {
  it("returns default limit and offset", () => {
    const params = paginationParams({});
    expect(params).toEqual({ limit: "25", offset: "0" });
  });

  it("passes through provided values", () => {
    const params = paginationParams({ limit: 10, offset: 50 });
    expect(params).toEqual({ limit: "10", offset: "50" });
  });

  it("caps limit at 100", () => {
    const params = paginationParams({ limit: 200 });
    expect(params).toEqual({ limit: "100", offset: "0" });
  });
});

describe("formatPaginatedResponse", () => {
  it("formats response with pagination info", () => {
    const result = formatPaginatedResponse(
      { count: 100, results: [{ id: 1 }, { id: 2 }] },
      25,
      0
    );
    expect(result).toContain('"count": 100');
    expect(result).toContain('"showing": 2');
    expect(result).toContain('"offset": 0');
    expect(result).toContain('"has_more": true');
  });

  it("detects when no more pages", () => {
    const result = formatPaginatedResponse(
      { count: 2, results: [{ id: 1 }, { id: 2 }] },
      25,
      0
    );
    expect(result).toContain('"has_more": false');
  });
});
