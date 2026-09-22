import "dotenv/config";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { Request, Response, NextFunction } from "express";
import { createEtsyMcpServer } from "./index.js";

const apiKey = process.env.ETSY_API_KEY;
const sharedSecret = process.env.ETSY_SHARED_SECRET;
const mcpAuthToken = process.env.MCP_AUTH_TOKEN;
const port = Number(process.env.PORT ?? 8080);

if (!apiKey || !sharedSecret || !mcpAuthToken) {
  console.error("Error: ETSY_API_KEY, ETSY_SHARED_SECRET, and MCP_AUTH_TOKEN are required.");
  process.exit(1);
}

function requireBearerToken(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || token !== mcpAuthToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

const app = createMcpExpressApp({ host: "0.0.0.0", allowedHosts: undefined });

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/mcp", requireBearerToken, async (req, res) => {
  try {
    const server = createEtsyMcpServer({
      apiKey,
      sharedSecret,
      tokenStorePath: process.env.ETSY_TOKEN_STORE_PATH,
    });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on("close", () => {
      transport.close();
      server.close();
    });
  } catch (err) {
    console.error("Error handling MCP request:", err);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
    }
  }
});

app.get("/mcp", requireBearerToken, (_req, res) => {
  res.writeHead(405).end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }));
});

app.delete("/mcp", requireBearerToken, (_req, res) => {
  res.writeHead(405).end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`etsy-mcp HTTP server listening on port ${port}`);
});
