import { NextResponse } from "next/server";
import { rrBasicLimits, rrPremiumLimits } from "~/server/auth.ts";

export async function GET() {
  return NextResponse.json(
    {
      basicPlan: rrBasicLimits,
      premiumPlan: rrPremiumLimits,
    },
    { status: 200 },
  );
}
