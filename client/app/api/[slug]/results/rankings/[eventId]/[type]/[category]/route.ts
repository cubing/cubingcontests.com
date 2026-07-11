import type { NextRequest } from "next/server";
import z from "zod";
import { type ContestType, RecordCategoryValues } from "~/helpers/types.ts";
import { db } from "~/server/db/provider.ts";
import { getRankings, getSettingFromDb } from "~/server/server-only-functions.ts";

export async function GET(
  req: NextRequest,
  { params }: RouteContext<"/api/[slug]/results/rankings/[eventId]/[type]/[category]">,
) {
  const searchParams = req.nextUrl.searchParams;
  const parsedParams = z
    .strictObject({
      slug: z.string().nonempty(),
      eventId: z.string().nonempty(),
      type: z.enum(["single", "average", "all-avg-formats"]),
      category: z.enum([...RecordCategoryValues, "all"]),
    })
    .safeParse(await params);
  if (!parsedParams.success) return new Response(`Validation error: ${parsedParams.error}`, { status: 400 });
  const { slug, eventId, type, category: recordCategory } = parsedParams.data;

  const show = searchParams.get("show") as "persons" | "results" | null;
  if (show && !["persons", "results"].includes(show))
    return new Response(`Validation error: ${show} is not a valid value for the show parameter`, { status: 400 });
  const region = searchParams.get("region");
  const topN = searchParams.get("topN");

  const organization = await db.query.organizations.findFirst({ columns: { id: true }, where: { slug } });
  if (!organization) return new Response("Space not found", { status: 404 });

  if (recordCategory !== "all") {
    const contestTypes = (await getSettingFromDb({ key: "contest-types", organizationId: organization.id }))!.split(
      ",",
    ) as ContestType[];
    const errorResponse = new Response("This record category is disabled for this space", { status: 400 });
    if (recordCategory === "competitions") {
      if (!contestTypes.includes("comp") && !contestTypes.includes("wca-comp")) return errorResponse;
    } else if (recordCategory === "meetups") {
      if (!contestTypes.includes("meetup")) return errorResponse;
    } else if (recordCategory === "online") {
      if (!contestTypes.includes("online")) return errorResponse;
    }
  }

  const event = await db.query.events.findFirst({ where: { organizationId: organization.id, eventId } });
  if (!event) return new Response(`Event with ID ${eventId} not found`, { status: 400 });

  const rankings = await getRankings(organization.id, event, type, recordCategory, {
    show: show ?? undefined,
    region: region ?? undefined,
    topN: topN ? parseInt(topN, 10) : undefined,
  });

  return Response.json(rankings);
}
