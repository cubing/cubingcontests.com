"use client";

import type { Subscription } from "@better-auth/stripe";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useContext, useState, useTransition } from "react";
import useSWR from "swr";
import Form from "~/app/components/form/Form.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import Button from "~/app/components/UI/Button.tsx";
import { authClient } from "~/helpers/auth-client.ts";
import { C, rrBasicLimits, rrPremiumLimits } from "~/helpers/constants.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { useSession } from "~/helpers/hooks.ts";
import { getActionError, getFormattedDate, slugPath } from "~/helpers/utility-functions.ts";
import { getStripePricesSF } from "~/server/server-functions/server-functions.ts";

type Props = {
  activeSubscription: Subscription | undefined;
};

function BillingScreen({ activeSubscription }: Props) {
  const router = useRouter();
  const { slug }: { slug: string } = useParams();
  const { changeErrorMessages, resetMessages } = useContext(MainContext);
  const { organization } = useSession();

  const { data: prices } = useSWR(["subscription-prices"], async () => {
    const res = await getStripePricesSF();
    if (res.serverError || res.validationErrors) {
      changeErrorMessages([getActionError(res)]);
      return null;
    }
    return {
      basic: {
        monthly: res.data!.find((p) => p.lookupKey === "rr_basic_monthly")!,
        annual: res.data!.find((p) => p.lookupKey === "rr_basic_annual")!,
      },
      premium: {
        monthly: res.data!.find((p) => p.lookupKey === "rr_premium_monthly")!,
        annual: res.data!.find((p) => p.lookupKey === "rr_premium_annual")!,
      },
    };
  });
  const [plan, setPlan] = useState<"basic" | "premium">((activeSubscription?.plan as "basic" | "premium") ?? "basic");
  const [annual, setAnnual] = useState(activeSubscription?.billingInterval === "year");
  const [isTosUnderstood, setIsTosUnderstood] = useState(!!activeSubscription);
  const [isPending, startTransition] = useTransition();

  const returnUrl = `/${organization?.slug}/billing`;
  const basicDiscount = prices
    ? Math.round(100 - (prices.basic.annual.amount / (prices.basic.monthly.amount * 12)) * 100)
    : undefined;
  const premiumDiscount = prices
    ? Math.round(100 - (prices.premium.annual.amount / (prices.premium.monthly.amount * 12)) * 100)
    : undefined;

  const getFormattedPrice = (priceInfo: { amount: number; currency: string } | undefined) => {
    if (!priceInfo) return "Loading...";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: priceInfo.currency,
    }).format(priceInfo.amount / 100);
  };

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

  const canChangePlan = !activeSubscription;
  const basicSelected = plan === "basic";
  const premiumSelected = plan === "premium";

  return (
    <div className="mx-auto" style={{ maxWidth: "var(--rr-md-width)" }}>
      {!activeSubscription && (
        <>
          <p className="tw:mb-6">
            <span className="fw-bold text-warning">
              Please note that other users will not be able to access this space until you set up billing.
            </span>{" "}
          </p>
          <p>
            Start by <Link href={slugPath(slug, "/mod/events")}>customizing your list of events</Link> and creating your
            first competition to try out the functionality of RecordRanks. You can set up billing when you're ready to
            announce the competition to your community members.{" "}
            <span className="fw-bold">
              If you don't start your free trial within{" "}
              <span className="text-warning">{C.rrDaysBeforeStartingFreeTrial} days</span>, your space may be
              deactivated.
            </span>
          </p>
        </>
      )}

      <div className="d-flex justify-content-center my-4">
        {/* biome-ignore lint/a11y/useSemanticElements: this is the most suitable way to make a button group */}
        <div role="group" className="btn-group" aria-label="Billing period">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            disabled={!canChangePlan}
            className={`btn ${annual ? "btn-outline-secondary" : "btn-secondary"}`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            disabled={!canChangePlan}
            className={`btn ${annual ? "btn-secondary" : "btn-outline-secondary"}`}
          >
            Annual
            <span className="badge ms-2 bg-success">Save 30%!</span>
          </button>
        </div>
      </div>

      <Form
        buttonText={activeSubscription ? "Upgrade" : "Start Free Trial"}
        onSubmit={subscribe}
        submitButtonSuccessStyle
        disableControls={activeSubscription !== undefined || !isTosUnderstood}
        isLoading={isPending}
      >
        <div className="row">
          {/* Basic Plan */}
          <div className="col-md-6 mb-4">
            <button
              type="button"
              onClick={() => setPlan("basic")}
              disabled={!canChangePlan}
              className={`card mx-auto h-100 border border-success ${basicSelected ? "border-5 tw:shadow-lg" : "tw:opacity-85"} tw:disabled:cursor-default! tw:disabled:opacity-85`}
            >
              <div className="card-body tw:text-start">
                <h5 className="card-title fs-4 fw-bold mb-2 text-success">Basic Plan</h5>
                <p className="mb-3">Best for smaller sports communities</p>
                <div className="mb-1 tw:flex tw:flex-wrap tw:items-baseline tw:gap-2">
                  <span className="fw-bold fs-1">
                    {getFormattedPrice(prices?.basic[annual ? "annual" : "monthly"])}
                  </span>
                  <span className="text-body-secondary">/{annual ? "year" : "month"}</span>
                  {annual && <span className="badge bg-success">Save {basicDiscount}%</span>}
                </div>
                <p className="fw-semibold mb-3">30 day free trial</p>
                <ul className="d-flex mb-0 flex-column list-unstyled gap-2">
                  <li className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:icon-[tabler--check] text-success tw:text-lg" title="Check" />
                    Up to {rrBasicLimits.monthlyContests} competitions per month
                  </li>
                  <li className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:icon-[tabler--check] text-success tw:text-lg" title="Check" />
                    Up to {rrBasicLimits.competitors} total competitors
                  </li>
                  <li className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:icon-[tabler--check] text-success tw:text-lg" title="Check" />
                    Basic support
                  </li>
                  <li className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:icon-[tabler--check] text-success tw:text-lg" title="Check" />
                    Data backups available on request
                  </li>
                </ul>
              </div>
              {basicSelected && (
                <div className="card-footer fw-semibold border-success bg-success-subtle py-2 text-center">
                  Selected
                </div>
              )}
            </button>
          </div>

          {/* Premium Plan */}
          <div className="col-md-6 mb-4">
            <button
              type="button"
              onClick={() => setPlan("premium")}
              disabled={!canChangePlan}
              className={`card mx-auto h-100 border border-danger ${premiumSelected ? "border-5 tw:shadow-lg" : "tw:opacity-85"} tw:disabled:cursor-default! tw:disabled:opacity-85`}
            >
              <div className="card-body tw:text-start">
                <div className="d-flex mb-2 gap-3 align-items-center">
                  <h5 className="card-title fw-bold fs-4 m-0 text-danger">Premium Plan</h5>
                  <span className="badge bg-danger tw:text-xs!">Best Value</span>
                </div>
                <p className="mb-3">Best for growing sports organizations</p>
                <div className="mb-1 tw:flex tw:flex-wrap tw:items-baseline tw:gap-2">
                  <span className="fw-bold fs-1">
                    {getFormattedPrice(prices?.premium[annual ? "annual" : "monthly"])}
                  </span>
                  <span className="text-body-secondary">/{annual ? "year" : "month"}</span>
                  {annual && <span className="badge bg-success">Save {premiumDiscount}%</span>}
                </div>
                <p className="fw-semibold mb-3">30 day free trial</p>
                <ul className="d-flex mb-0 flex-column list-unstyled gap-2">
                  <li className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:icon-[tabler--check] text-success tw:text-lg" title="Check" />
                    Up to {rrPremiumLimits.monthlyContests} competitions per month
                  </li>
                  <li className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:icon-[tabler--check] text-success tw:text-lg" title="Check" />
                    Up to {rrPremiumLimits.competitors} total competitors
                  </li>
                  <li className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:icon-[tabler--check] text-success tw:text-lg" title="Check" />
                    Priority support
                  </li>
                  <li className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:icon-[tabler--check] text-success tw:text-lg" title="Check" />
                    Automated weekly backups
                  </li>
                  <li className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:icon-[tabler--check] text-success tw:text-lg" title="Check" />
                    No "Support RecordRanks" links
                  </li>
                  <li className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:icon-[tabler--check] text-success tw:text-lg" title="Check" />
                    Public data exports
                  </li>
                  <li className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:icon-[tabler--check] text-success tw:text-lg" title="Check" />
                    Custom banner
                  </li>
                </ul>
              </div>
              {premiumSelected && (
                <div className="card-footer fw-semibold border-danger bg-danger-subtle py-2 text-center">Selected</div>
              )}
            </button>
          </div>
        </div>

        <p className="tw:text-center text-body-secondary tw:italic">Prices include VAT</p>

        {!activeSubscription ? (
          <div className="d-flex column-gap-2 mt-4 flex-wrap">
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

      <p className="tw:mb-8">
        Once billing is set up, the space will remain publicly accessible with or without an active subscription, unless
        it's set to private in the space's settings.
      </p>

      {activeSubscription && (
        <>
          <Button onClick={goToBillingPortal} className="btn-secondary">
            Manage your billing information
          </Button>
          <p className="mt-4">
            If you would like to change your plan or if you have any other questions, please{" "}
            <a href="https://recordranks.com/contact" rel="noopener">
              contact support
            </a>
            .
          </p>
        </>
      )}

      <p>
        You can find more information on the{" "}
        <a href="https://recordranks.com/pricing" rel="noopener">
          pricing page
        </a>
        .
      </p>
    </div>
  );
}

export default BillingScreen;
