"use client";

import { faPencil } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useMemo, useState } from "react";
import FiltersContainer from "~/app/components/FiltersContainer.tsx";
import Form from "~/app/components/form/Form.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import ActiveInactiveIcon from "~/app/components/UI/ActiveInactiveIcon.tsx";
import Button from "~/app/components/UI/Button.tsx";
import type { authClient } from "~/helpers/auth-client.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { getHasRole, getSimplifiedString } from "~/helpers/utility-functions.ts";
import { rolesObject } from "~/server/permissions.ts";

type Props = {
  users: (typeof authClient.$Infer.Session.user & { providerId: string })[];
};

function ManageUsersScreen({ users: initUsers }: Props) {
  const { resetMessages } = useContext(MainContext);

  // const { executeAsync: updateUser, isPending: isUpdating } = useAction(updateUserSF);
  const isUpdating = false;
  const [users, _setUsers] = useState(initUsers);
  const [_userId, setUserId] = useState<string>();
  const [name, setName] = useState(""); // for email + password users this is the same as the username
  const [email, setEmail] = useState("");
  const [isUser, setIsUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const simplifiedSearch = getSimplifiedString(search);

    return users.filter(
      (u) =>
        u.name.toLocaleLowerCase().includes(simplifiedSearch) || u.email.toLocaleLowerCase().includes(simplifiedSearch),
    );
  }, [search, users]);

  const handleSubmit = async () => {
    //   const roles: Role[] = [];
    //   if (isUser) roles.push("user");
    //   if (isAdmin) roles.push("admin");
    //   const res = await updateUser({ id: userId!, roles });
    //   if (res.serverError || res.validationErrors) {
    //     changeErrorMessages([getActionError(res)]);
    //   } else {
    //     resetMessages();
    //     setUserId(undefined);
    //     setName("");
    //     setUsers(users.map((u) => (u.id === userId ? { ...res.data!.user, providerId: u.providerId } : u)));
    //   }
  };

  const onEditUser = (user: typeof authClient.$Infer.Session.user) => {
    window.scrollTo(0, 0);
    resetMessages();

    setUserId(user.id);
    setName(user.name);
    setEmail(user.email);

    if (!user.role) throw new Error("Error: user role is empty");
    setIsUser(getHasRole("user", user.role));
    setIsAdmin(getHasRole("admin", user.role));
  };

  return (
    <>
      {name && (
        <Form
          buttonText="Submit"
          onSubmit={handleSubmit}
          hideToasts
          onCancel={() => setName("")}
          isLoading={isUpdating}
        >
          <div className="row mb-3">
            <div className="col">
              <FormTextInput title="Name" value={name} disabled />
            </div>
            <div className="col">
              <FormTextInput title="Email" value={email} setValue={setEmail} disabled />
            </div>
          </div>
          <h5 className="my-3">Roles</h5>
          <FormCheckbox title={rolesObject.user} selected={isUser} setSelected={setIsUser} disabled={isUpdating} />
          <FormCheckbox title={rolesObject.admin} selected={isAdmin} setSelected={setIsAdmin} disabled={isUpdating} />
        </Form>
      )}

      <div className="px-2">
        <FiltersContainer className="mt-4 mb-2">
          <FormTextInput title="Search" value={search} setValue={setSearch} oneLine />
        </FiltersContainer>
        <p className="text-secondary">Search by name, username, email or competitor name</p>

        <p className="mb-2">
          Number of users:&nbsp;<b>{filteredUsers.length}</b>
        </p>
      </div>

      <div className="table-responsive mt-3">
        <table className="table-hover table text-nowrap">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Provider ID</th>
              <th scope="col">Roles</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => {
              const roles = user
                .role!.split(",")
                .map((role) => (rolesObject as any)[role])
                .join(", ");

              return (
                <tr key={user.id}>
                  <td>{index + 1}</td>
                  <td className="text-truncate" style={{ maxWidth: "20rem" }}>
                    {user.name}
                  </td>
                  <td>
                    <div className="d-flex gap-2 align-items-center">
                      {user.email}
                      {user.providerId === "credential" && <ActiveInactiveIcon isActive={user.emailVerified} />}
                    </div>
                  </td>
                  <td>{user.providerId}</td>
                  <td>{roles}</td>
                  <td>
                    <Button onClick={() => onEditUser(user)} disabled className="btn-xs" title="Edit" ariaLabel="Edit">
                      <FontAwesomeIcon icon={faPencil} />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default ManageUsersScreen;
