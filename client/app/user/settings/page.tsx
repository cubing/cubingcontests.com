"use client";

import { useEffect, useState } from "react";
import { useMyFetch } from "~/helpers/customHooks.ts";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import Button from "~/app/components/UI/Button.tsx";
import Competitor from "~/app/components/Competitor.tsx";
import C from "~/shared_helpers/constants.ts";
import { IFeUser } from "~/shared_helpers/types.ts";
import { getRoleLabel } from "~/shared_helpers/sharedFunctions.ts";
import { Role } from "~/shared_helpers/enums.ts";
import { logOutUser } from "~/helpers/utilityFunctions.ts";

const UserSettingsPage = () => {
  const myFetch = useMyFetch();

  const [user, setUser] = useState<IFeUser>();

  const filteredRoles = user?.roles?.filter((r) => r !== Role.User) ?? [];

  useEffect(() => {
    myFetch.get("/users/details", { authorize: true }).then(
      ({ payload, errors }) => {
        if (!errors) setUser(payload);
      },
    );
  }, []);

  const deleteUser = async () => {
    const answer = confirm(
      "Are you CERTAIN you would like to delete your account? This action is permanent!",
    );

    if (answer) {
      const { errors } = await myFetch.delete("/users", {
        loadingId: "delete_account_button",
        keepLoadingOnSuccess: true,
      });

      if (!errors) logOutUser();
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-center">Settings</h2>

      <ToastMessages />

      {user && (
        <>
          <p className="mb-2">
            Email address: <b>{user.email}</b>
          </p>
          <p className="mb-4" style={{ fontSize: "0.85rem" }}>
            Changing your email address is currently not supported. Please send an email to {C.contactEmail}{" "}
            if you would like to change your email.
          </p>
          {user.person
            ? (
              <p className="d-flex gap-2">
                Your competitor profile: <Competitor person={user.person} showLocalizedName />
              </p>
            )
            : <p>There is no competitor profile tied to your account.</p>}
          {filteredRoles.length > 0 && (
            <p>
              Your roles: {filteredRoles.map((r, i) => (
                <span key={r}>
                  {i !== 0 && <span>,</span>}
                  <b>{getRoleLabel(r, true)}</b>
                </span>
              ))}
            </p>
          )}

          <Button
            id="delete_account_button"
            onClick={deleteUser}
            className="mt-4 btn-danger btn-sm"
          >
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
};

export default UserSettingsPage;
