import DebugScreen from "~/app/admin/debug/DebugScreen.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { authorizeUser } from "~/server/server-only-functions/server-only-functions.ts";

async function DebugPage() {
  await authorizeUser({ useOrganization: false, role: "admin" });

  return (
    <section className="px-3">
      <h2 className="mb-5 text-center">Page for debugging</h2>

      <ToastMessages />

      <div className="mx-auto mb-4 w-100" style={{ maxWidth: "var(--rr-md-width)" }}>
        <DebugScreen />

        <h4 className="my-4">Environment variables (server-side)</h4>
        <code>POD_NAME={process.env.POD_NAME}</code>
      </div>
    </section>
  );
}

export default DebugPage;
