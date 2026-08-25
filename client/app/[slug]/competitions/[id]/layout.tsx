import { and, eq } from "drizzle-orm";
import z from "zod";
import LoadingError from "~/app/components/UI/LoadingError.tsx";
import { db } from "~/server/db/provider.ts";
import { contestsTable } from "~/server/db/schema/contests.ts";
import { getOrgDetails } from "~/server/server-only-functions/server-only-functions.ts";

const ParamsValidator = z.strictObject({
  slug: z.string().nonempty(),
  id: z.string().nonempty(),
});

type Props = {
  children: React.ReactNode;
  params: Promise<z.infer<typeof ParamsValidator>>;
};

async function ContestLayout({ children, params }: Props) {
  const { slug, id } = ParamsValidator.parse(await params);
  const organization = await getOrgDetails({ slug });

  const [contest] = await db
    .select({ name: contestsTable.name })
    .from(contestsTable)
    .where(and(eq(contestsTable.organizationId, organization.id), eq(contestsTable.competitionId, id)))
    .limit(1);

  if (!contest) return <LoadingError loadingEntity="contest" />;

  return (
    <section className="mb-4">
      <h2 className="mb-3 px-3 text-center">{contest.name}</h2>

      {children}
    </section>
  );
}

export default ContestLayout;
