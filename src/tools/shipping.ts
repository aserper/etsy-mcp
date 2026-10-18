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
    description: "Create, update or delete shipping destinations on a profile. Use update (not delete + create) to change a rate, e.g. primary_cost 0 for free shipping.",
    inputSchema: {
      shop_id: z.number().describe("The shop ID"),
      shipping_profile_id: z.number().describe("The shipping profile ID"),
      action: z.enum(["create", "update", "delete"]).describe("Action to perform"),
      shipping_profile_destination_id: z.number().optional().describe("Destination ID (for update/delete)"),
      primary_cost: z.number().optional().describe("Primary cost (for create/update)"),
      secondary_cost: z.number().optional().describe("Secondary cost (for create/update)"),
      destination_country_iso: z.string().optional().describe("Destination country ISO (for create/update)"),
      destination_region: z.string().optional().describe("Destination region (for create/update)"),
      shipping_carrier_id: z.number().optional().describe("Carrier ID (0 = Other); required with mail_class if no delivery days"),
      mail_class: z.string().optional().describe("Carrier mail class"),
      min_delivery_days: z.number().optional().describe("Min delivery days (required when no carrier/mail_class)"),
      max_delivery_days: z.number().optional().describe("Max delivery days (required when no carrier/mail_class)"),
    },
  }, async (args) => {
    const basePath = `/shops/${args.shop_id}/shipping-profiles/${args.shipping_profile_id}/destinations`;
    let data: unknown;
    const fields = {
      primary_cost: args.primary_cost, secondary_cost: args.secondary_cost,
      destination_country_iso: args.destination_country_iso, destination_region: args.destination_region,
      shipping_carrier_id: args.shipping_carrier_id, mail_class: args.mail_class,
      min_delivery_days: args.min_delivery_days, max_delivery_days: args.max_delivery_days,
    };
    if (args.action === "create") {
      data = await client.post(basePath, fields);
    } else if (args.action === "update") {
      data = await client.put(`${basePath}/${args.shipping_profile_destination_id}`, fields);
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
