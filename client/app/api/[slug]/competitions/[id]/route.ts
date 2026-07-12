import type { NextRequest } from "next/server";
import z from "zod";
import { db } from "~/server/db/provider.ts";
import { getContest } from "~/server/server-only-functions/contests-functions.ts";

export async function GET(_: NextRequest, { params }: RouteContext<"/api/[slug]/competitions/[id]">) {
  const parsedParams = z
    .strictObject({ slug: z.string().nonempty(), id: z.string().nonempty() })
    .safeParse(await params);
  if (!parsedParams.success) return new Response(`Validation error: ${parsedParams.error}`, { status: 400 });

  const organization = await db.query.organizations.findFirst({
    columns: { id: true },
    where: { slug: parsedParams.data.slug },
  });
  if (!organization) return new Response("Space not found", { status: 404 });

  const contest = await getContest({ organizationId: organization.id, competitionId: parsedParams.data.id });
  if (!contest) return new Response("Contest not found", { status: 404 });

  return Response.json(contest, { status: 200 });
}
