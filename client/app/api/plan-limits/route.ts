import { rrBasicLimits, rrPremiumLimits } from "~/helpers/constants.ts";

export async function GET() {
  return Response.json(
    {
      basicPlan: rrBasicLimits,
      premiumPlan: rrPremiumLimits,
    },
    { status: 200 },
  );
}
