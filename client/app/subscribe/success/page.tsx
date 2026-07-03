import Link from "next/link";
import { slugPath } from "~/helpers/utility-functions.ts";
import { authorizeUser } from "~/server/server-only-functions.ts";

async function SubscriptionSuccess() {
  const { organization } = await authorizeUser({ useOrganization: true });

  return (
    <section className="px-3 pb-3">
      <h2 className="mb-4 text-center">Subscription Success</h2>

      <p className="fs-5 text-center">The subscription for your space is now active! You can safely leave this page.</p>

      <Link
        href={slugPath(organization!.slug, "/billing")}
        className="btn btn-secondary d-block mx-auto mt-4"
        style={{ width: "fit-content" }}
      >
        Back to billing
      </Link>
    </section>
  );
}

export default SubscriptionSuccess;
