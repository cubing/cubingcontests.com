import { headers } from "next/headers";
import { redirect } from "next/navigation";
import OrganizationForm from "~/app/components/OrganizationForm.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
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

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect("/register");
  } catch {
    redirect("/register");
  }

  return (
    <section className="container mx-auto p-3" style={{ maxWidth: "var(--rr-md-width)" }}>
      <h2 className="mb-4 text-center">Create Your Own Space</h2>

      <p className="fs-5 mb-4 text-center">
        Fill out the form below to create your own space. After creating your space, you'll be taken to the billing page
        to set up your subscription.
      </p>

      <ToastMessages />

      <OrganizationForm />
    </section>
  );
}

export default SubscribePage;
