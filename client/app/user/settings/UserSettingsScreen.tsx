"use client";

import capitalize from "lodash/capitalize";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useTransition } from "react";
import Competitor from "~/app/components/Competitor.tsx";
import Button from "~/app/components/UI/Button.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { authClient } from "~/helpers/authClient.ts";
import { C } from "~/helpers/constants.ts";
import { MainContext } from "~/helpers/contexts.ts";
import type { PersonResponse } from "~/server/db/schema/persons.ts";

type Props = {
  person: PersonResponse | undefined;
};

function UserSettingsScreen({ person }: Props) {
  const router = useRouter();
  const { changeErrorMessages, changeSuccessMessage } = useContext(MainContext);
  const { data: session, isPending } = authClient.useSession();
  const [isDeleting, startTransition] = useTransition();

  useEffect(() => {
    if (!isPending && !session) router.push("/login");
  }, [isPending]);

  const deleteUser = () => {
    if (confirm("Are you CERTAIN you would like to delete your account? This action is permanent!")) {
      startTransition(async () => {
        const { error } = await authClient.deleteUser();

        if (error) {
          changeErrorMessages([error.message ?? error.statusText]);
        } else {
          changeSuccessMessage("Your account has been successfully deleted");
          setTimeout(() => router.push("/"), 2000);
        }
      });
    }
  };

  return (
    <div className="px-2">
      <ToastMessages />

      {session && (
        <>
          <p className="mb-2">
            Email address: <b>{session.user.email}</b>
          </p>
          <p className="mb-4" style={{ fontSize: "0.85rem" }}>
            Changing your email address is currently not supported. Please send an email to {C.contactEmail} if you
            would like to change your email.
          </p>
          {session.user.personId ? (
            <p className="d-flex flex-wrap gap-2">
              <span>Your competitor profile:</span>
              <Competitor person={person} showLocalizedName />
              <span>
                (CC ID: <b>{session.user.personId}</b>)
              </span>
            </p>
          ) : (
            <p>There is no competitor profile tied to your account.</p>
          )}
          {session.user.role && (
            <p>
              Your role: <strong>{capitalize(session.user.role)}</strong>.
            </p>
          )}

          <Button onClick={deleteUser} isLoading={isDeleting} className="btn-danger btn-sm mt-4">
            Delete Account
          </Button>
          <p className="mt-2" style={{ fontSize: "0.85rem" }}>
            This deletes all of your account data, but does not affect your competitor data, even if your competitor
            profile is tied to your account.
          </p>
        </>
      )}
    </div>
  );
}

export default UserSettingsScreen;
