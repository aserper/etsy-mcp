import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EtsyClient } from "../client/etsy-client.js";
import { paginationParams, formatPaginatedResponse } from "../utils/pagination.js";

export function registerTransactionsTools(server: McpServer, client: EtsyClient): void {
  server.registerTool("get_transactions_by_shop", {
    description: "Get all transactions for a shop",
    inputSchema: {
      shop_id: z.number().describe("The shop ID"),
      limit: z.number().optional().describe("Results per page"),
      offset: z.number().optional().describe("Offset for pagination"),
    },
  }, async (args) => {
    const params = paginationParams({ limit: args.limit, offset: args.offset });
    const data = await client.get<{ count: number; results: unknown[] }>(`/shops/${args.shop_id}/transactions`, params);
    return { content: [{ type: "text" as const, text: formatPaginatedResponse(data, args.limit ?? 25, args.offset ?? 0) }] };
  });

  server.registerTool("get_transaction", {
    description: "Get a specific transaction by ID",
    inputSchema: {
      shop_id: z.number().describe("The shop ID"),
      transaction_id: z.number().describe("The transaction ID"),
    },
  }, async (args) => {
    const data = await client.get(`/shops/${args.shop_id}/transactions/${args.transaction_id}`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.registerTool("get_transactions_by_receipt", {
    description: "Get all transactions for a specific receipt",
    inputSchema: {
      shop_id: z.number().describe("The shop ID"),
      receipt_id: z.number().describe("The receipt ID"),
    },
  }, async (args) => {
    const data = await client.get(`/shops/${args.shop_id}/receipts/${args.receipt_id}/transactions`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  });
}
