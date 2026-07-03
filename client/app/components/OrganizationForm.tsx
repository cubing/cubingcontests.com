"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useContext } from "react";
import Button from "~/app/components/UI/Button.tsx";
import { C } from "~/helpers/constants.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { getActionError, slugPath } from "~/helpers/utility-functions.ts";
import { createOrganizationSF } from "~/server/server-functions/user-server-functions.ts";

function OrganizationForm() {
  const router = useRouter();
  const { changeSuccessMessage, changeErrorMessages, resetMessages } = useContext(MainContext);

  const { executeAsync: createOrganization, isPending: isCreating } = useAction(createOrganizationSF);

  const handleCreateOrganization = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetMessages();

    const formData = new FormData(e.target);
    const res = await createOrganization({
      ...Object.fromEntries(formData.entries()),
      contestTypes: formData.getAll("contestTypes"), // override contestTypes to handle checkbox array properly
    } as any);

    if (res.serverError || res.validationErrors) {
      console.log(res.serverError, res.validationErrors);
      changeErrorMessages([getActionError(res)]);
    } else {
      changeSuccessMessage("Successfully created new space! Redirecting to billing page...");
      e.target.reset();
      setTimeout(() => router.push(slugPath(res.data!.slug, "/billing")), 2000);
    }
  };

  return (
    <>
      <form onSubmit={handleCreateOrganization} className="my-4">
        <fieldset className="mb-3">
          <label htmlFor="name_input" className="form-label">
            Name *
          </label>
          <input
            id="name_input"
            type="text"
            name="name"
            placeholder="E.g: International Association of ..."
            required
            className="form-control"
          />
        </fieldset>

        <fieldset className="mb-3">
          <label htmlFor="slug_input" className="form-label">
            Space ID *
          </label>
          <input
            id="slug_input"
            type="text"
            name="slug"
            placeholder="E.g: iax"
            required
            minLength={C.minSlugCharacters}
            maxLength={C.maxSlugCharacters}
            className="form-control"
          />
          <div className="form-text mt-2">
            Must be 8-24 characters long, using only lowercase letters and numbers. If you end up purchasing the Premium
            plan and would like to reserve a shorter space ID,{" "}
            <a href={C.rrContactLink} target="_blank" rel="noopener">
              contact us
            </a>{" "}
            after you set up billing.
          </div>
        </fieldset>

        <fieldset className="mb-3">
          <label htmlFor="contact_email_input" className="form-label">
            Contact Email *
          </label>
          <input id="contact_email_input" type="email" name="contactEmail" required className="form-control" />
          <div className="form-text mt-2">
            This email will be displayed as the main contact for your space's members. This can be a shared address that
            forwards emails to the whole admin team for your space.
          </div>
        </fieldset>

        <fieldset className="mb-3">
          <legend className="form-label">Contest types</legend>
          <div className="d-flex flex-wrap gap-3">
            <div className="form-check">
              <input
                type="checkbox"
                id="contest_type_comp"
                name="contestTypes"
                value="comp"
                defaultChecked
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor="contest_type_comp">
                Competitions
              </label>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                id="contest_type_meetup"
                name="contestTypes"
                value="meetup"
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor="contest_type_meetup">
                Meetups
              </label>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                id="contest_type_online"
                name="contestTypes"
                value="online"
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor="contest_type_online">
                Online competitions
              </label>
            </div>
          </div>
          <div className="form-text mt-2">
            Select which contest types you will be organizing in your space. You can change this later.
          </div>
        </fieldset>

        <fieldset className="mb-3">
          <label htmlFor="logo_input" className="form-label">
            Logo URL
          </label>
          <input id="logo_input" type="url" name="logo" className="form-control" />
          <div className="form-text mt-2">
            You can leave this blank and{" "}
            <a href={C.rrContactLink} target="_blank" rel="noopener">
              contact us
            </a>{" "}
            to host your logo file on the RecordRanks servers.
          </div>
        </fieldset>

        <fieldset className="mb-3">
          <label htmlFor="home_page_description" className="form-label">
            Home page description (Markdown supported)
          </label>
          <textarea id="home_page_description" name="homePageDescription" rows={4} className="form-control" />
        </fieldset>

        <fieldset className="mb-4">
          <label htmlFor="about_page_content" className="form-label">
            About page contents (Markdown supported)
          </label>
          <textarea id="about_page_content" name="aboutPageContent" rows={4} className="form-control" />
        </fieldset>

        <Button type="submit" isLoading={isCreating} className="w-100">
          Create Space
        </Button>
      </form>
    </>
  );
}

export default OrganizationForm;
