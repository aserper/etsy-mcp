import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EtsyClient } from "../client/etsy-client.js";

export function registerShippingTools(server: McpServer, client: EtsyClient): void {
  server.registerTool("get_shipping_profiles", {
    description: "List all shipping profiles for a shop",
    inputSchema: { shop_id: z.number().describe("The shop ID") },
  }, async (args) => {
    const data = await client.get(`/shops/${args.shop_id}/shipping-profiles`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("create_shipping_profile", {
    description: "Create a new shipping profile for a shop",
    inputSchema: {
      shop_id: z.number().describe("The shop ID"),
      title: z.string().describe("Profile title"),
      origin_country_iso: z.string().describe("Origin country ISO code (e.g., 'US')"),
      primary_cost: z.number().describe("Primary shipping cost"),
      secondary_cost: z.number().describe("Additional item shipping cost"),
      min_processing_days: z.number().describe("Minimum processing days"),
      max_processing_days: z.number().describe("Maximum processing days"),
      destination_country_iso: z.string().optional().describe("Destination country ISO"),
    },
  }, async (args) => {
    const { shop_id, ...body } = args;
    const data = await client.post(`/shops/${shop_id}/shipping-profiles`, body);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("update_shipping_profile", {
    description: "Update an existing shipping profile",
    inputSchema: {
      shop_id: z.number().describe("The shop ID"),
      shipping_profile_id: z.number().describe("The shipping profile ID"),
      title: z.string().optional().describe("Profile title"),
      origin_country_iso: z.string().optional().describe("Origin country ISO code"),
      primary_cost: z.number().optional().describe("Primary shipping cost"),
      secondary_cost: z.number().optional().describe("Additional item cost"),
      min_processing_days: z.number().optional().describe("Min processing days"),
      max_processing_days: z.number().optional().describe("Max processing days"),
    },
  }, async (args) => {
    const { shop_id, shipping_profile_id, ...body } = args;
    const data = await client.put(`/shops/${shop_id}/shipping-profiles/${shipping_profile_id}`, body);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("manage_shipping_destinations", {
    description: "Create or delete shipping destinations on a profile",
    inputSchema: {
      shop_id: z.number().describe("The shop ID"),
      shipping_profile_id: z.number().describe("The shipping profile ID"),
      action: z.enum(["create", "delete"]).describe("Action to perform"),
      shipping_profile_destination_id: z.number().optional().describe("Destination ID (for delete)"),
      primary_cost: z.number().optional().describe("Primary cost (for create)"),
      secondary_cost: z.number().optional().describe("Secondary cost (for create)"),
      destination_country_iso: z.string().optional().describe("Destination country ISO (for create)"),
      destination_region: z.string().optional().describe("Destination region (for create)"),
    },
  }, async (args) => {
    const basePath = `/shops/${args.shop_id}/shipping-profiles/${args.shipping_profile_id}/destinations`;
    let data: unknown;
    if (args.action === "create") {
      data = await client.post(basePath, {
        primary_cost: args.primary_cost, secondary_cost: args.secondary_cost,
        destination_country_iso: args.destination_country_iso, destination_region: args.destination_region,
      });
    } else {
      await client.delete(`${basePath}/${args.shipping_profile_destination_id}`);
      data = { deleted: true, id: args.shipping_profile_destination_id };
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("get_shipping_carriers", {
    description: "List available shipping carriers by origin country",
    inputSchema: { origin_country_iso: z.string().describe("Origin country ISO code (e.g., 'US')") },
  }, async (args) => {
    const data = await client.get("/shipping-carriers", { origin_country_iso: args.origin_country_iso });
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  });
}
