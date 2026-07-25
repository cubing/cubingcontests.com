import { connection, NextResponse } from "next/server";
import { getHealthcheck } from "~/app/api/healthcheck/healthcheck.ts";

export async function GET() {
  await connection();

  const [dbStatus, nodemailerStatus, memoryStatus, homePageStatus] = await getHealthcheck();

  const allHealthy = dbStatus.healthy && nodemailerStatus.healthy && memoryStatus.healthy && homePageStatus.healthy;
  const healthcheck = {
    status: allHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: dbStatus,
      nodemailer: nodemailerStatus,
      memory: memoryStatus,
      homePage: homePageStatus,
    },
  };

  return NextResponse.json(healthcheck, { status: allHealthy ? 200 : 503 });
}
