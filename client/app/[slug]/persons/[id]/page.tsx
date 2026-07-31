import { and, eq } from "drizzle-orm";
import z from "zod";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { db } from "~/server/db/provider.ts";
import { personsPublicCols, personsTable as table } from "~/server/db/schema/persons.ts";
import { getOrgDetails } from "~/server/server-only-functions/server-only-functions.ts";

const ParamsValidator = z.strictObject({
  slug: z.string().nonempty(),
  id: z
    .string()
    .refine((val) => !Number.isNaN(val) && parseInt(val, 10) > 0, { error: "Invalid person ID" })
    .transform((val) => parseInt(val, 10)),
});

type Props = {
  params: Promise<z.infer<typeof ParamsValidator>>;
};

async function PersonPage({ params }: Props) {
  const { slug, id } = await params;

  const organization = await getOrgDetails({ slug });
  const [[person]] = await Promise.all([
    db
      .select(personsPublicCols)
      .from(table)
      .where(and(eq(table.organizationId, organization.id), eq(table.id, id)))
      .limit(1),
  ]);

  if (!person) return <LoadingError loadingEntity="person" />;

  return (
    <section>
      <h2 className="mb-3 text-center">{person.name}</h2>
    </section>
  );
}

export default PersonPage;
