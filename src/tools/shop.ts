import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EtsyClient } from "../client/etsy-client.js";
import { paginationParams, formatPaginatedResponse } from "../utils/pagination.js";

export function registerShopTools(server: McpServer, client: EtsyClient): void {
  server.registerTool("get_shop", {
    description: "Get details of an Etsy shop by ID",
    inputSchema: { shop_id: z.number().describe("The shop ID") },
  }, async (args) => {
    const data = await client.get(`/shops/${args.shop_id}`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("update_shop", {
    description: "Update shop settings (requires shop owner auth)",
    inputSchema: {
      shop_id: z.number().describe("The shop ID"),
      title: z.string().optional().describe("Shop title"),
      announcement: z.string().optional().describe("Shop announcement"),
      sale_message: z.string().optional().describe("Message to buyers after purchase"),
      digital_sale_message: z.string().optional().describe("Message for digital purchases"),
      policy_welcome: z.string().optional().describe("Shop policy welcome message"),
    },
  }, async (args) => {
    const { shop_id, ...body } = args;
    const data = await client.put(`/shops/${shop_id}`, body);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("find_shops", {
    description: "Search for Etsy shops by name",
    inputSchema: {
      shop_name: z.string().describe("Shop name to search for"),
      limit: z.number().optional().describe("Results per page"),
      offset: z.number().optional().describe("Offset for pagination"),
    },
  }, async (args) => {
    const params: Record<string, string> = { shop_name: args.shop_name, ...paginationParams({ limit: args.limit, offset: args.offset }) };
    const data = await client.get<{ count: number; results: unknown[] }>("/shops", params);
    return { content: [{ type: "text" as const, text: formatPaginatedResponse(data, args.limit ?? 25, args.offset ?? 0) }] };
  });

  server.registerTool("get_shop_sections", {
    description: "Get all sections of a shop",
    inputSchema: { shop_id: z.number().describe("The shop ID") },
  }, async (args) => {
    const data = await client.get(`/shops/${args.shop_id}/sections`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("manage_shop_sections", {
    description: "Create, update, or delete a shop section",
    inputSchema: {
      shop_id: z.number().describe("The shop ID"),
      action: z.enum(["create", "update", "delete"]).describe("Action to perform"),
      shop_section_id: z.number().optional().describe("Section ID (required for update/delete)"),
      title: z.string().optional().describe("Section title (required for create/update)"),
    },
  }, async (args) => {
    let data: unknown;
    switch (args.action) {
      case "create":
        data = await client.post(`/shops/${args.shop_id}/sections`, { title: args.title });
        break;
      case "update":
        data = await client.put(`/shops/${args.shop_id}/sections/${args.shop_section_id}`, { title: args.title });
        break;
      case "delete":
        await client.delete(`/shops/${args.shop_id}/sections/${args.shop_section_id}`);
        data = { deleted: true, shop_section_id: args.shop_section_id };
        break;
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  });
}
