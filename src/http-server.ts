import "dotenv/config";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { createEtsyMcpServer } from "./index.js";
import { SingleUserOAuthProvider } from "./auth/mcp-oauth-provider.js";

const apiKey = process.env.ETSY_API_KEY;
const sharedSecret = process.env.ETSY_SHARED_SECRET;
const mcpAuthToken = process.env.MCP_AUTH_TOKEN;
const port = Number(process.env.PORT ?? 8080);
const publicUrl = process.env.PUBLIC_URL;

if (!apiKey || !sharedSecret || !mcpAuthToken || !publicUrl) {
  console.error("Error: ETSY_API_KEY, ETSY_SHARED_SECRET, MCP_AUTH_TOKEN, and PUBLIC_URL are required.");
  process.exit(1);
}

const provider = new SingleUserOAuthProvider(mcpAuthToken);
const issuerUrl = new URL(publicUrl);

const app = createMcpExpressApp({ host: "0.0.0.0", allowedHosts: undefined });

app.use(mcpAuthRouter({ provider, issuerUrl }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const requireAuth = requireBearerAuth({ verifier: provider });

app.post("/mcp", requireAuth, async (req, res) => {
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

app.get("/mcp", requireAuth, (_req, res) => {
  res.writeHead(405).end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }));
});

app.delete("/mcp", requireAuth, (_req, res) => {
  res.writeHead(405).end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`etsy-mcp HTTP server listening on port ${port}`);
});
