import { headers } from "next/headers";
import Link from "next/link";
import OrganizationSelect from "~/app/components/OrganizationSelect.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { C, IS_RR_INSTANCE } from "~/helpers/constants.ts";
import { getHasRole } from "~/helpers/utility-functions.ts";
import { auth } from "~/server/auth.ts";
import { db } from "~/server/db/provider.ts";

async function HomePage() {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  const isAdmin = session && getHasRole("admin", session.user.role);
  const organizations = isAdmin
    ? await db.query.organizations.findMany({
        columns: { id: true, name: true, slug: true, createdAt: true, logo: true, metadata: true },
      })
    : session
      ? await auth.api.listOrganizations({ headers: hdrs })
      : undefined;
  const memberships = session
    ? await db.query.members.findMany({ columns: { role: true }, where: { userId: session.user.id } })
    : [];

  return (
    <section className="container mx-auto p-3" style={{ maxWidth: "var(--rr-md-width)" }}>
      <p className="fs-4 mb-5 text-center">Please select a space</p>

      <ToastMessages />

      {(!session || isAdmin || !memberships.some((m) => getHasRole("owner", m.role))) && (
        <>
          <Link href={session ? "/subscribe" : "/login"} className="btn btn-success btn-lg d-block mb-5">
            Create New Space!
          </Link>

          <hr className="mb-5" />
        </>
      )}

      <div className="mb-5">
        {organizations === undefined ? (
          <Link href="/login" className="btn btn-primary btn-lg d-block">
            Log in
          </Link>
        ) : organizations.length === 0 ? (
          <p className="fs-5 my-3 text-center">
            You are not part of any spaces on {process.env.NEXT_PUBLIC_PROJECT_NAME}.
          </p>
        ) : (
          <OrganizationSelect organizations={organizations} />
        )}
      </div>

      {IS_RR_INSTANCE && (
        <p className="fs-5">
          Have a question?{" "}
          <a href="https://recordranks.com/contact" rel="noopener">
            Contact support
          </a>{" "}
          to get help with using RecordRanks or join our{" "}
          <a href={C.rrDiscordServerLink} target="_blank" rel="noopener">
            Discord
          </a>
          .
        </p>
      )}
    </section>
  );
}

export default HomePage;
