import Link from "next/link";
import { slugPath } from "~/helpers/utility-functions.ts";
import { authorizeUser } from "~/server/server-only-functions/server-only-functions.ts";

async function SubscriptionSuccess() {
  const { organization } = await authorizeUser({ useOrganization: true });

  return (
    <section className="px-3 pb-3">
      <h2 className="mb-4 text-center">Subscription Success</h2>

      <p className="fs-5 text-center">
        Your subscription is now <strong>active</strong>!
      </p>
      <p className="text-center">You can go to the dashboard to start customizing your space.</p>

      <div className="tw:mt-6 tw:flex tw:justify-center tw:gap-6">
        <Link href={slugPath(organization!.slug, "/mod")} className="btn btn-primary">
          Dashboard
        </Link>
        <Link href={slugPath(organization!.slug, "/billing")} className="btn btn-secondary">
          Back to billing
        </Link>
      </div>
    </section>
  );
}

export default SubscriptionSuccess;
