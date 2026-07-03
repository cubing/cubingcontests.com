"use client";

import type { Subscription } from "@better-auth/stripe";
import { useRouter } from "next/navigation";
import { useContext, useState, useTransition } from "react";
import Form from "~/app/components/form/Form.tsx";
import FormInputLabel from "~/app/components/form/FormInputLabel.tsx";
import Button from "~/app/components/UI/Button.tsx";
import { authClient } from "~/helpers/auth-client.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { useSession } from "~/helpers/hooks.ts";
import { getFormattedDate } from "~/helpers/utility-functions.ts";

type Props = {
  activeSubscription: Subscription | undefined;
};

function BillingScreen({ activeSubscription }: Props) {
  const router = useRouter();
  const { changeErrorMessages, resetMessages } = useContext(MainContext);
  const { organization } = useSession();

  const [plan, setPlan] = useState<"basic" | "premium">((activeSubscription?.plan as "basic" | "premium") ?? "premium");
  const [annual, setAnnual] = useState(activeSubscription?.billingInterval === "year");
  const [isPending, startTransition] = useTransition();

  const returnUrl = `/${organization?.slug}/billing`;

  const subscribe = () => {
    resetMessages();
    startTransition(async () => {
      const { error } = await authClient.subscription.upgrade({
        plan,
        annual,
        referenceId: organization!.id,
        subscriptionId: activeSubscription?.id,
        customerType: "organization",
        successUrl: "/subscribe/success",
        cancelUrl: returnUrl,
      });

      if (error) changeErrorMessages([error.message ?? error.statusText]);
    });
  };

  const goToBillingPortal = async () => {
    resetMessages();
    const { data, error } = await authClient.subscription.billingPortal({
      referenceId: organization!.id,
      customerType: "organization",
      returnUrl,
    });

    if (error) changeErrorMessages([error.message ?? error.statusText]);
    else router.push(data.url);
  };

  return (
    <div className="mx-auto w-100" style={{ maxWidth: "var(--rr-md-width)" }}>
      <Form
        buttonText={activeSubscription ? "Upgrade" : "Subscribe"}
        onSubmit={subscribe}
        submitButtonSuccessStyle
        disableControls={activeSubscription !== undefined}
        isLoading={isPending}
        className="mb-5"
      >
        <FormInputLabel inputId="plan" text="Plan" />
        <div id="plan" className="btn-group mb-3">
          <Button
            onClick={() => {
              if (!activeSubscription) setPlan("basic");
            }}
            className={`btn btn-primary ${plan === "basic" ? "active" : ""}`}
          >
            Basic
          </Button>
          <Button
            onClick={() => {
              if (!activeSubscription) setPlan("premium");
            }}
            className={`btn btn-primary ${plan === "premium" ? "active" : ""}`}
          >
            Premium
          </Button>
        </div>

        {activeSubscription?.cancelAt ? (
          <p>Your subscription will be cancelled on {getFormattedDate(activeSubscription.cancelAt)}</p>
        ) : activeSubscription?.trialEnd ? (
          <p>Your trial ends on {getFormattedDate(activeSubscription.trialEnd)}</p>
        ) : (
          activeSubscription?.periodEnd && (
            <p>Your subscription renews on {getFormattedDate(activeSubscription.periodEnd)}</p>
          )
        )}

        <FormInputLabel inputId="annual" text="Billing Period" />
        <div id="annual" className="btn-group mb-3">
          <Button
            onClick={() => {
              if (!activeSubscription) setAnnual(false);
            }}
            className={`btn btn-primary ${annual ? "" : "active"}`}
          >
            Monthly
          </Button>
          <Button
            onClick={() => {
              if (!activeSubscription) setAnnual(true);
            }}
            className={`btn btn-primary ${annual ? "active" : ""}`}
          >
            Annual
          </Button>
        </div>
      </Form>

      {activeSubscription && (
        <Button onClick={goToBillingPortal} className="btn-secondary">
          Manage your billing information
        </Button>
      )}
    </div>
  );
}

export default BillingScreen;
