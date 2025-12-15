import "server-only";
import { fileURLToPath } from "node:url";
import pino from "pino";

if (!process.env.LOGFLARE_PUBLIC_ACCESS_TOKEN)
  throw new Error("LOGFLARE_PUBLIC_ACCESS_TOKEN environment variable not set!");
if (!process.env.LOGFLARE_API_BASE_URL) throw new Error("LOGFLARE_API_BASE_URL environment variable not set!");

/**
 * Use this query in Supabase Logs to view Cubing Contests logs:
 *
 * select id, function_edge_logs.timestamp, event_message, metadata from function_edge_logs where metadata->>'cc_log' = 'true' order by timestamp desc limit 100;
 */

const transport = pino.transport({
  target: "pino-logflare",
  options: {
    apiBaseUrl: process.env.LOGFLARE_API_BASE_URL,
    apiKey: process.env.LOGFLARE_PUBLIC_ACCESS_TOKEN,
    // sourceToken: "your-source-token",
    // either sourceToken or sourceName can be provided. sourceToken takes precedence.
    sourceName: "deno-relay-logs",

    // handle errors on the client side
    // onError: { module: "my_utils", method: "handleErrors" },
    // transform events before sending
    onPreparePayload: {
      module: fileURLToPath(import.meta.url.replace(/\/logger.ts$/, "/loggerUtils.js")),
      method: "handlePayload",
    },
  },
});

export const logger = pino(transport);
