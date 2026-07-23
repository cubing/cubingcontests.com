"use client";

import type { Subscription } from "@better-auth/stripe";
import { useRouter } from "next/navigation";
import { useContext, useState, useTransition } from "react";
import useSWR from "swr";
import Form from "~/app/components/form/Form.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import FormInputLabel from "~/app/components/form/FormInputLabel.tsx";
import Button from "~/app/components/UI/Button.tsx";
import { authClient } from "~/helpers/auth-client.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { useSession } from "~/helpers/hooks.ts";
import { getActionError, getFormattedDate } from "~/helpers/utility-functions.ts";
import { getStripePriceSF } from "~/server/server-functions/server-functions.ts";

type Props = {
  activeSubscription: Subscription | undefined;
};

function BillingScreen({ activeSubscription }: Props) {
  const router = useRouter();
  const { changeErrorMessages, resetMessages } = useContext(MainContext);
  const { organization } = useSession();

  const [plan, setPlan] = useState<"basic" | "premium">((activeSubscription?.plan as "basic" | "premium") ?? "basic");
  const [annual, setAnnual] = useState(activeSubscription?.billingInterval === "year");
  const [isTosUnderstood, setIsTosUnderstood] = useState(!!activeSubscription);
  const [isPending, startTransition] = useTransition();

  const returnUrl = `/${organization?.slug}/billing`;
  const lookupKey = `rr_${plan}_${annual ? "annual" : "monthly"}`;

  const { data: priceInfo } = useSWR(
    ["subscription-price", lookupKey],
    async () => {
      resetMessages();
      const res = await getStripePriceSF({ lookupKey });
      if (res.serverError || res.validationErrors) {
        changeErrorMessages([getActionError(res)]);
        return null;
      }
      return res.data;
    },
    { dedupingInterval: 60_000 },
  );

  // Format the price for display
  const formattedPrice = priceInfo
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: priceInfo.currency,
      }).format(priceInfo.amount / 100)
    : "Loading...";

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
      <p className="fs-5">Please select your plan and billing period:</p>

      <Form
        buttonText={activeSubscription ? "Upgrade" : "Start Free Trial"}
        onSubmit={subscribe}
        submitButtonSuccessStyle
        disableControls={activeSubscription !== undefined || !isTosUnderstood}
        isLoading={isPending}
      >
        <div className="d-flex column-gap-4 mb-2 flex-wrap">
          <div>
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
          </div>

          <div>
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
          </div>
        </div>

        <div className="mb-3">
          Price: <strong>{formattedPrice}</strong>
          {priceInfo && <span className="ms-1 text-muted">/{annual ? "year" : "month"}</span>}
        </div>

        {!activeSubscription ? (
          <>
            <p className="fw-bold mb-4">
              <span className="text-info">30 day free trial</span>, with free cancellation before the end of the trial
              period!
            </p>

            <div className="d-flex column-gap-2 mt-3 flex-wrap">
              <FormCheckbox
                title="I have read and accept the"
                selected={isTosUnderstood}
                setSelected={setIsTosUnderstood}
                disabled={isPending}
              />
              <a href="https://recordranks.com/tos" target="_blank" rel="noopener">
                Terms of Service
              </a>
            </div>
          </>
        ) : activeSubscription.cancelAt ? (
          <p>Your subscription will be cancelled on {getFormattedDate(activeSubscription.cancelAt)}</p>
        ) : activeSubscription.trialEnd ? (
          <p>Your trial ends on {getFormattedDate(activeSubscription.trialEnd)}</p>
        ) : (
          activeSubscription.periodEnd && (
            <p>Your subscription renews on {getFormattedDate(activeSubscription.periodEnd)}</p>
          )
        )}
      </Form>

      <p className="mb-4">
        <span className="fw-bold text-warning">
          Please note that if billing isn't set up within 24 hours, the space may be deleted, which means you will have
          to create it again.
        </span>{" "}
        Once billing is set up, the space will remain publicly accessible with or without an active subscription, unless
        it's set to private in the space's settings.
      </p>

      {activeSubscription && (
        <Button onClick={goToBillingPortal} className="btn-secondary">
          Manage your billing information
        </Button>
      )}
    </div>
  );
}

export default BillingScreen;
