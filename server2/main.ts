import { type Context, Hono } from "hono";
import { serveStatic } from "hono/deno";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { find as findTimezone } from "geo-tz";

const app = new Hono().basePath("/api2");

app.use(
  "/static/*",
  serveStatic({ root: "./static", rewriteRequestPath: (path) => path.replace(/^\/api2\/static\//, "") }),
);

app.get(
  "/timezone",
  zValidator(
    "query",
    z.object({
      latitude: z.coerce.number().gte(-90).lte(90),
      longitude: z.coerce.number().gte(-180).lte(180),
    }),
  ),
  (c: Context) => {
    const { latitude, longitude } = c.req.valid("query" as never);

    return c.json({ timeZone: findTimezone(latitude, longitude)[0] });
  },
);

const port = parseInt(Deno.env.get("BACKEND2_PORT") as string);
if (!port) throw new Error("Please provide a BACKEND2_PORT environment variable");

Deno.serve({ port }, app.fetch);
