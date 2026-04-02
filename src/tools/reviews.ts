import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EtsyClient } from "../client/etsy-client.js";
import { paginationParams, formatPaginatedResponse } from "../utils/pagination.js";

export function registerReviewsTools(server: McpServer, client: EtsyClient): void {
  server.registerTool("get_reviews_by_listing", {
    description: "Get reviews for a specific listing",
    inputSchema: {
      listing_id: z.number().describe("The listing ID"),
      limit: z.number().optional().describe("Results per page"),
      offset: z.number().optional().describe("Offset for pagination"),
    },
  }, async (args) => {
    const params = paginationParams({ limit: args.limit, offset: args.offset });
    const data = await client.get<{ count: number; results: unknown[] }>(`/listings/${args.listing_id}/reviews`, params);
    return { content: [{ type: "text" as const, text: formatPaginatedResponse(data, args.limit ?? 25, args.offset ?? 0) }] };
  });

  server.registerTool("get_reviews_by_shop", {
    description: "Get reviews for a shop",
    inputSchema: {
      shop_id: z.number().describe("The shop ID"),
      limit: z.number().optional().describe("Results per page"),
      offset: z.number().optional().describe("Offset for pagination"),
    },
  }, async (args) => {
    const params = paginationParams({ limit: args.limit, offset: args.offset });
    const data = await client.get<{ count: number; results: unknown[] }>(`/shops/${args.shop_id}/reviews`, params);
    return { content: [{ type: "text" as const, text: formatPaginatedResponse(data, args.limit ?? 25, args.offset ?? 0) }] };
  });
}
