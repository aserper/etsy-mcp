import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EtsyClient } from "../client/etsy-client.js";
import { paginationParams, formatPaginatedResponse } from "../utils/pagination.js";

export function registerPaymentsTools(server: McpServer, client: EtsyClient): void {
  server.registerTool("get_payments", {
    description: "Get payments for a shop or a specific receipt (read-only)",
    inputSchema: {
      shop_id: z.number().describe("The shop ID"),
      receipt_id: z.number().optional().describe("Filter by receipt ID"),
    },
  }, async (args) => {
    const path = args.receipt_id
      ? `/shops/${args.shop_id}/receipts/${args.receipt_id}/payments`
      : `/shops/${args.shop_id}/payments`;
    const data = await client.get(path);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("get_ledger_entries", {
    description: "Get payment account ledger entries for a shop",
    inputSchema: {
      shop_id: z.number().describe("The shop ID"),
      min_created: z.number().optional().describe("Minimum creation timestamp"),
      max_created: z.number().optional().describe("Maximum creation timestamp"),
      limit: z.number().optional().describe("Results per page"),
      offset: z.number().optional().describe("Offset for pagination"),
    },
  }, async (args) => {
    const params: Record<string, string> = { ...paginationParams({ limit: args.limit, offset: args.offset }) };
    if (args.min_created) params.min_created = String(args.min_created);
    if (args.max_created) params.max_created = String(args.max_created);
    const data = await client.get<{ count: number; results: unknown[] }>(`/shops/${args.shop_id}/payment-account/ledger-entries`, params);
    return { content: [{ type: "text" as const, text: formatPaginatedResponse(data, args.limit ?? 25, args.offset ?? 0) }] };
  });
}
