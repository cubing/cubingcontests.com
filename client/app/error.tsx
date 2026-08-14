"use client";

import { useEffect } from "react";
import { logErrorSF } from "~/server/server-functions/server-functions.ts";

type Props = {
  error: Error & { digest?: string };
};

function ErrorPage({ error }: Props) {
  useEffect(() => {
    logErrorSF({ errorMessage: error.message });
  }, [error]);

  return (
    <section>
      <h4 className="my-4 text-center">Error</h4>

      <p className="text-center">
        Error:{" "}
        {error.message.includes("An error occurred in the Server Components render") ? "Unknown error" : error.message}
      </p>
    </section>
  );
}

export default ErrorPage;
