import { headers } from "next/headers";
import Link from "next/link";
import OrganizationSelect from "~/app/components/OrganizationSelect.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { auth } from "~/server/auth.ts";

async function HomePage() {
  let organizations: (typeof auth.$Infer.Organization)[];

  try {
    const data = await auth.api.listOrganizations({ headers: await headers() });
    organizations = data;
  } catch {
    organizations = [];
  }

  return (
    <section className="container mx-auto p-3" style={{ maxWidth: "var(--rr-md-width)" }}>
      <p className="fs-4 mb-5 text-center">Please select a space</p>

      <ToastMessages />

      <Link href="/subscribe" className="btn btn-success btn-lg d-block mb-5">
        Create New Space!
      </Link>

      {organizations.length === 0 ? (
        <p className="fs-5 my-3 text-center">
          You are not part of any spaces on {process.env.NEXT_PUBLIC_PROJECT_NAME}.
        </p>
      ) : (
        <OrganizationSelect organizations={organizations} />
      )}
    </section>
  );
}

export default HomePage;
