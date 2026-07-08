import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import OrganizationForm from "~/app/subscribe/OrganizationForm.tsx";
import { IS_RR_INSTANCE } from "~/helpers/constants.ts";
import { auth } from "~/server/auth.ts";

async function SubscribePage() {
  // Same as the billing page
  if (!IS_RR_INSTANCE) {
    return (
      <p className="fs-4 mx-3 mt-5 text-center">
        A RecordRanks subscription can only be purchased on app.recordranks.com
      </p>
    );
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/register");

  return (
    <section className="container mx-auto p-3" style={{ maxWidth: "var(--rr-md-width)" }}>
      <h2 className="mb-4 text-center">Create Your Own Space</h2>

      <p className="fs-5 mb-4 text-center text-info">
        After creating your space, you'll be taken to the billing page to set up billing
      </p>

      <ToastMessages />

      <OrganizationForm />
    </section>
  );
}

export default SubscribePage;
