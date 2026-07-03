import BillingScreen from "~/app/[slug]/billing/SubscribeScreen.tsx";
import { IS_RR_INSTANCE } from "~/helpers/constants.ts";
import { auth } from "~/server/auth.ts";
import { authorizeUser } from "~/server/server-only-functions.ts";

async function BillingPage() {
  // Same as the subscribe page
  if (!IS_RR_INSTANCE) {
    return (
      <p className="fs-4 mx-3 mt-5 text-center">
        A RecordRanks subscription can only be purchased on app.recordranks.com
      </p>
    );
  }

  const { organization, httpHeaders } = await authorizeUser({ useOrganization: true, orgRole: "owner" });

  const subscriptions = await auth.api.listActiveSubscriptions({
    headers: httpHeaders,
    query: { referenceId: organization!.id, customerType: "organization" },
  });

  const activeSubscription = subscriptions.find((sub) => sub.status === "active" || sub.status === "trialing");

  return (
    <section className="px-3 pb-3">
      <h2 className="mb-4 text-center">Billing for space {organization!.name}</h2>

      <BillingScreen activeSubscription={activeSubscription} />
    </section>
  );
}

export default BillingPage;
