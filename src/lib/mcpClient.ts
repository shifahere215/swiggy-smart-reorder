import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export async function createSwiggyMCPClient(accessToken: string, server: 'food' | 'instamart' | 'dineout' = 'instamart') {
  const serverPath = server === 'instamart' ? 'im' : server;
  const transport = new SSEClientTransport(new URL(`https://mcp.swiggy.com/${serverPath}/sse`), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    }
  });

  const client = new Client({
    name: "smart-reorder",
    version: "1.0.0",
  }, {
    capabilities: {}
  });

  await client.connect(transport);
  return client;
}
