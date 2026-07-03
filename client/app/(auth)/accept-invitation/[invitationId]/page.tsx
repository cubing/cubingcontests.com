"use client";

import { useParams, useRouter } from "next/navigation";
import { useContext, useTransition } from "react";
import Button from "~/app/components/UI/Button.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { authClient } from "~/helpers/auth-client.ts";
import { MainContext } from "~/helpers/contexts.ts";

function AcceptInvitationPage() {
  const { invitationId }: { invitationId: string } = useParams();
  const router = useRouter();
  const { resetMessages, changeErrorMessages, changeSuccessMessage } = useContext(MainContext);

  const [isAccepting, startAcceptInvitationTransition] = useTransition();
  const [isRejecting, startRejectInvitationTransition] = useTransition();

  const isPending = isAccepting || isRejecting;

  const acceptInvitation = async () => {
    resetMessages();

    startAcceptInvitationTransition(async () => {
      const { error } = await authClient.organization.acceptInvitation({ invitationId });

      if (error) {
        changeErrorMessages([error.message ?? error.statusText]);
      } else {
        changeSuccessMessage("Successfully accepted invitation");
        setTimeout(() => router.push("/"), 2000);
      }
    });
  };

  const rejectInvitation = async () => {
    resetMessages();

    startRejectInvitationTransition(async () => {
      const { error } = await authClient.organization.rejectInvitation({ invitationId });

      if (error) {
        changeErrorMessages([error.message ?? error.statusText]);
      } else {
        changeSuccessMessage("Successfully rejected invitation");
        setTimeout(() => router.push("/"), 2000);
      }
    });
  };

  return (
    <section className="px-3">
      <h2 className="mb-4 text-center">Accept Invitation</h2>

      <ToastMessages />

      <p className="fs-5 mb-4 text-center">Click one of the buttons below to accept or reject the invitation.</p>

      <div className="d-flex justify-content-center gap-3">
        <Button onClick={() => acceptInvitation()} isLoading={isAccepting} disabled={isPending} className="btn-success">
          Accept Invitation
        </Button>
        <Button onClick={() => rejectInvitation()} isLoading={isRejecting} disabled={isPending} className="btn-danger">
          Reject Invitation
        </Button>
      </div>
    </section>
  );
}

export default AcceptInvitationPage;
