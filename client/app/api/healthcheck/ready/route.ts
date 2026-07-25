import { connection, NextResponse } from "next/server";
import { getHealthcheck } from "~/app/api/healthcheck/healthcheck.ts";

export async function GET() {
  await connection();

  const [dbStatus, nodemailerStatus, memoryStatus] = await getHealthcheck();

  const ready = dbStatus.healthy && nodemailerStatus.healthy && memoryStatus.healthy;
  const readynessCheck = {
    status: ready ? "ready" : "not ready",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  return NextResponse.json(readynessCheck, { status: ready ? 200 : 503 });
}
