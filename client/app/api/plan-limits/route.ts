import { rrBasicLimits, rrPremiumLimits } from "~/server/auth.ts";

export async function GET() {
  return Response.json(
    {
      basicPlan: rrBasicLimits,
      premiumPlan: rrPremiumLimits,
    },
    { status: 200 },
  );
}
