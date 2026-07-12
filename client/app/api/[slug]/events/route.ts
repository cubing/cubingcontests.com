import type { NextRequest } from "next/server";
import z from "zod";
import { db } from "~/server/db/provider.ts";
import { getEvents } from "~/server/server-only-functions/server-only-functions.ts";

export async function GET(_: NextRequest, { params }: RouteContext<"/api/[slug]/events">) {
  const parsedParams = z.strictObject({ slug: z.string().nonempty() }).safeParse(await params);
  if (!parsedParams.success) return new Response(`Validation error: ${parsedParams.error}`, { status: 400 });

  const organization = await db.query.organizations.findFirst({
    columns: { id: true },
    where: { slug: parsedParams.data.slug },
  });
  if (!organization) return new Response("Space not found", { status: 404 });

  const events = await getEvents({
    organizationId: organization.id,
    columns: "public+rules",
    includeHiddenAndRemoved: true,
  });

  return Response.json(events, { status: 200 });
}
