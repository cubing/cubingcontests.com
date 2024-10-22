import { type Context, Hono } from "hono";
import { serveStatic } from "hono/deno";

const app = new Hono().basePath("/api2");

app.use(
  "/static/*",
  serveStatic({ root: "./static", rewriteRequestPath: (path) => path.replace(/^\/api2\/static\//, "") }),
);

app.get("/", (c: Context) => {
  return c.text("Hello Hono!");
});

Deno.serve({ port: parseInt(Deno.env.get("BACKEND2_PORT") as string) }, app.fetch);
