import { type Context, Hono } from "hono";
import { serveStatic } from "hono/deno";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import mongoose from "mongoose";
import { z } from "zod";
import { find as findTimezone } from "geo-tz";
import { CollectiveSolutionModel } from "./models/collective-solution.model.ts";
import { CollectiveSolution } from "@cc/shared";

const environment = Deno.env.get("ENVIRONMENT");
const mongoDevUsername = Deno.env.get("MONGO_DEV_USERNAME");
const mongoDevPassword = Deno.env.get("MONGO_DEV_PASSWORD");

if (!mongoDevUsername) throw new Error("MONGO DB USERNAME NOT SET!");
if (!mongoDevPassword) throw new Error("MONGO DB PASSWORD NOT SET!");
if (!Deno.env.has("BASE_URL")) throw new Error("BASE URL NOT SET!");
if (!Deno.env.has("FRONTEND_PORT")) throw new Error("FRONTEND PORT NOT SET!");

const app = new Hono().basePath("/api2");
let mongoUri = `mongodb://${mongoDevUsername}:${mongoDevPassword}`;

if (environment === "production") {
  const corsOptions = {
    origin: [Deno.env.get("BASE_URL") as string, `http://cc-client:${Deno.env.get("FRONTEND_PORT")}`],
  };
  console.log(`Setting CORS origin policy for ${corsOptions.origin.join(", ")}`);
  app.use(cors(corsOptions));

  mongoUri += "@cc-mongo:27017/cubingcontests";
} else {
  app.use(cors());
  mongoUri += "@127.0.0.1:27017/cubingcontests";
}

// This is a temporary hack due to Deno being unable to read the type
mongoose.connect(mongoUri).then(() => console.log("DB connection established"));

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

app.get("collective-solution", async (c: Context) => {
  const currentSolution: CollectiveSolution | null = await CollectiveSolutionModel.findOne({ state: { $lt: 30 } })
    .exec();

  if (!currentSolution) return;

  return c.json({
    eventId: currentSolution.eventId,
    attemptNumber: currentSolution.attemptNumber,
    scramble: currentSolution.scramble,
    solution: currentSolution.solution,
    state: currentSolution.state,
    lastUserWhoInteractedId: (currentSolution.lastUserWhoInteracted as any).toString(),
    totalUsersWhoMadeMoves: currentSolution.usersWhoMadeMoves.length,
  });
});

const port = parseInt(Deno.env.get("BACKEND2_PORT") as string);
if (!port) throw new Error("Please provide a BACKEND2_PORT environment variable");

Deno.serve({ port }, app.fetch);
