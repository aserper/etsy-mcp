import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EtsyClient } from "../client/etsy-client.js";
import { paginationParams, formatPaginatedResponse } from "../utils/pagination.js";

export function registerListingsTools(server: McpServer, client: EtsyClient): void {
  server.registerTool(
    "search_listings",
    {
      description: "Search active Etsy listings with keywords and filters",
      inputSchema: {
        keywords: z.string().optional().describe("Search keywords"),
        taxonomy_id: z.number().optional().describe("Filter by taxonomy/category ID"),
        min_price: z.number().optional().describe("Minimum price in USD"),
        max_price: z.number().optional().describe("Maximum price in USD"),
        sort_on: z.enum(["created", "price", "updated", "score"]).optional().describe("Sort field"),
        sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
        limit: z.number().optional().describe("Results per page (max 100)"),
        offset: z.number().optional().describe("Offset for pagination"),
      },
    },
    async (args) => {
      const params: Record<string, string> = {
        ...paginationParams({ limit: args.limit, offset: args.offset }),
      };
      if (args.keywords) params.keywords = args.keywords;
      if (args.taxonomy_id) params.taxonomy_id = String(args.taxonomy_id);
      if (args.min_price) params.min_price = String(args.min_price);
      if (args.max_price) params.max_price = String(args.max_price);
      if (args.sort_on) params.sort_on = args.sort_on;
      if (args.sort_order) params.sort_order = args.sort_order;

      const data = await client.get<{ count: number; results: unknown[] }>("/listings/active", params);
      return {
        content: [{ type: "text" as const, text: formatPaginatedResponse(data, args.limit ?? 25, args.offset ?? 0) }],
      };
    }
  );

  server.registerTool(
    "get_listing",
    {
      description: "Get details of a specific Etsy listing",
      inputSchema: {
        listing_id: z.number().describe("The listing ID"),
        includes: z.array(z.enum(["images", "shop", "user", "translations", "inventory"])).optional().describe("Related resources to include"),
      },
    },
    async (args) => {
      const params: Record<string, string> = {};
      if (args.includes?.length) params.includes = args.includes.join(",");
      const data = await client.get(`/listings/${args.listing_id}`, params);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "create_draft_listing",
    {
      description: "Create a new draft listing in a shop",
      inputSchema: {
        shop_id: z.number().describe("The shop ID"),
        title: z.string().describe("Listing title (max 140 chars)"),
        description: z.string().describe("Listing description"),
        price: z.number().describe("Price in shop's currency"),
        quantity: z.number().describe("Available quantity"),
        taxonomy_id: z.number().describe("Taxonomy/category ID"),
        who_made: z.enum(["i_did", "someone_else", "collective"]).describe("Who made the item"),
        when_made: z.enum(["made_to_order", "2020_2024", "2010_2019", "2005_2009", "before_2005", "2000_2004", "1990s", "1980s", "1970s", "1960s", "1950s", "1940s", "1930s", "1920s", "1910s", "1900s", "1800s", "1700s", "before_1700"]).describe("When it was made"),
        is_supply: z.boolean().describe("Is this a craft supply?"),
        shipping_profile_id: z.number().optional().describe("Shipping profile ID"),
        tags: z.array(z.string()).optional().describe("Tags (max 13)"),
        materials: z.array(z.string()).optional().describe("Materials list"),
        shop_section_id: z.number().optional().describe("Shop section ID"),
        is_customizable: z.boolean().optional().describe("Can be personalized"),
        is_digital: z.boolean().optional().describe("Digital download"),
      },
    },
    async (args) => {
      const { shop_id, ...body } = args;
      const data = await client.post(`/shops/${shop_id}/listings`, body);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "update_listing",
    {
      description: "Update an existing listing",
      inputSchema: {
        shop_id: z.number().describe("The shop ID"),
        listing_id: z.number().describe("The listing ID"),
        title: z.string().optional().describe("Listing title"),
        description: z.string().optional().describe("Listing description"),
        price: z.number().optional().describe("Price"),
        quantity: z.number().optional().describe("Quantity"),
        tags: z.array(z.string()).optional().describe("Tags"),
        materials: z.array(z.string()).optional().describe("Materials"),
        state: z.enum(["active", "inactive", "draft"]).optional().describe("Listing state"),
        taxonomy_id: z.number().optional().describe("Taxonomy ID"),
      },
    },
    async (args) => {
      const { shop_id, listing_id, ...body } = args;
      const data = await client.patch(`/shops/${shop_id}/listings/${listing_id}`, body);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "delete_listing",
    {
      description: "Delete a listing",
      inputSchema: { listing_id: z.number().describe("The listing ID to delete") },
    },
    async (args) => {
      await client.delete(`/listings/${args.listing_id}`);
      return { content: [{ type: "text" as const, text: `Listing ${args.listing_id} deleted.` }] };
    }
  );

  server.registerTool(
    "get_listings_by_shop",
    {
      description: "Get all listings for a shop, filterable by state",
      inputSchema: {
        shop_id: z.number().describe("The shop ID"),
        state: z.enum(["active", "inactive", "draft", "expired", "sold_out"]).optional().describe("Filter by listing state"),
        limit: z.number().optional().describe("Results per page"),
        offset: z.number().optional().describe("Offset for pagination"),
      },
    },
    async (args) => {
      const params: Record<string, string> = { ...paginationParams({ limit: args.limit, offset: args.offset }) };
      if (args.state) params.state = args.state;
      const data = await client.get<{ count: number; results: unknown[] }>(`/shops/${args.shop_id}/listings`, params);
      return { content: [{ type: "text" as const, text: formatPaginatedResponse(data, args.limit ?? 25, args.offset ?? 0) }] };
    }
  );
}
