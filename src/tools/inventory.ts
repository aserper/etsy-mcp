import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EtsyClient } from "../client/etsy-client.js";

export function registerInventoryTools(server: McpServer, client: EtsyClient): void {
  server.registerTool("get_listing_inventory", {
    description: "Get inventory (products, offerings, variations) for a listing",
    inputSchema: { listing_id: z.number().describe("The listing ID") },
  }, async (args) => {
    const data = await client.get(`/listings/${args.listing_id}/inventory`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("update_listing_inventory", {
    description: "Update inventory for a listing (products with offerings and prices)",
    inputSchema: {
      listing_id: z.number().describe("The listing ID"),
      products: z.array(z.object({
        sku: z.string().optional().describe("SKU"),
        property_values: z.array(z.object({
          property_id: z.number(),
          value_ids: z.array(z.number()),
          values: z.array(z.string()),
        })).optional(),
        offerings: z.array(z.object({
          price: z.number().describe("Price"),
          quantity: z.number().describe("Quantity"),
          is_enabled: z.boolean().describe("Is this offering enabled"),
        })),
      })).describe("Product inventory data"),
    },
  }, async (args) => {
    const data = await client.put(`/listings/${args.listing_id}/inventory`, { products: args.products });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  });
}
