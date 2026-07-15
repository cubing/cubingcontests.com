import { sql } from "drizzle-orm";
import nodemailer from "nodemailer";
import { db } from "~/server/db/provider.ts";
import { nodemailerConnectionOptions } from "~/server/email/connection-options.ts";

async function checkDatabase() {
  try {
    const start = Date.now();
    await db.execute(sql.raw("SELECT 1"));
    const latencyMs = Date.now() - start;

    return { healthy: true, latencyMs };
  } catch (error: any) {
    return { healthy: false, error: "message" in error ? error.message : "Unknown DB connection error" };
  }
}

async function checkNodemailer() {
  try {
    const start = Date.now();
    const transporter = nodemailer.createTransport(nodemailerConnectionOptions);
    await transporter.verify();
    const latencyMs = Date.now() - start;

    return { healthy: true, latencyMs };
  } catch (error: any) {
    return { healthy: false, error: "message" in error ? error.message : "Unknown Nodemailer error" };
  }
}

const maxHeapUsedPercentage = 99;

async function checkMemory() {
  const memory = process.memoryUsage();
  const heapUsedPercentage = (memory.heapUsed / memory.heapTotal) * 100;
  const healthy = heapUsedPercentage < maxHeapUsedPercentage;

  return {
    healthy,
    heapUsed: `${Math.round(heapUsedPercentage)}%`,
    heapUsedMiB: `${Math.round(memory.heapUsed / 1024 / 1024)} MiB`,
    heapTotalMiB: `${Math.round(memory.heapTotal / 1024 / 1024)} MiB`,
    ...(healthy ? {} : { error: `Heap usage exceeds ${maxHeapUsedPercentage}%` }),
  };
}

async function checkHomePage() {
  try {
    const start = Date.now();
    const response = await fetch(process.env.NEXT_PUBLIC_BASE_URL!, { signal: AbortSignal.timeout(5000) });
    await response.text(); // waits for the entire stream to complete
    const latencyMs = Date.now() - start;

    if (!response.ok) {
      return {
        healthy: false,
        error: `Home page check failed: HTTP ${response.status}`,
        status: response.status,
      };
    }

    return { healthy: true, latencyMs };
  } catch (error: any) {
    return { healthy: false, error: "message" in error ? error.message : "Home page check error" };
  }
}

export function getHealthcheck() {
  return Promise.all([checkDatabase(), checkNodemailer(), checkMemory(), checkHomePage()]);
}
