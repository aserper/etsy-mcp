import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EtsyClient } from "../client/etsy-client.js";

export function registerTaxonomyTools(server: McpServer, client: EtsyClient): void {
  server.registerTool("get_buyer_taxonomy", {
    description: "Get the full buyer taxonomy tree (categories)",
  }, async () => {
    const data = await client.get("/buyer-taxonomy/nodes");
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("get_taxonomy_properties", {
    description: "Get properties for a specific taxonomy/category node",
    inputSchema: { taxonomy_id: z.number().describe("The taxonomy node ID") },
  }, async (args) => {
    const data = await client.get(`/buyer-taxonomy/nodes/${args.taxonomy_id}/properties`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  });
}
