"use client";

import { useRouter } from "next/navigation";
import { useContext } from "react";
import { useSWRConfig } from "swr";
import { authClient } from "~/helpers/auth-client.ts";
import { MainContext } from "~/helpers/contexts.ts";

type Props = {
  organizations: (typeof authClient.$Infer.Organization)[];
};

function OrganizationSelect({ organizations }: Props) {
  const router = useRouter();
  const { changeErrorMessages } = useContext(MainContext);
  const { mutate } = useSWRConfig();

  const selectOrganization = async (organization: typeof authClient.$Infer.Organization) => {
    const { error } = await authClient.organization.setActive({ organizationId: organization.id });

    if (error) {
      changeErrorMessages([error.message ?? error.statusText]);
    } else {
      // Clear the SWR cache
      mutate(
        () => true, // update all keys
        undefined, // set cache data to undefined
        { revalidate: false },
      );
      router.push(`/${organization.slug}`);
    }
  };

  return (
    <div className="list-group">
      {organizations.map((organization) => (
        <button
          key={organization.id}
          type="button"
          onClick={() => selectOrganization(organization)}
          className="d-flex list-group-item list-group-item-action gap-3 align-items-center"
        >
          {organization.logo && <img src={organization.logo} height={50} width={50} alt="Logo" />}
          <span className="fs-5 text-body">{organization.name}</span>
        </button>
      ))}
    </div>
  );
}

export default OrganizationSelect;
