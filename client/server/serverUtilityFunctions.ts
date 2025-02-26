import "server-only";
import { auth } from "~/server/auth.ts";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { FetchError } from "~/helpers/types";

export function getValidationError(
  error: ZodError<any>,
): FetchError<any> {
  return {
    success: false,
    error: {
      code: "VALIDATION",
      message: error.errors.map((e) => e.message).join(" | "),
    },
  };
}

export async function authorizeUser() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  return session.user;
}
