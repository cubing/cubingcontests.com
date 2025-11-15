import Link from "next/link";
import { C } from "~/helpers/constants.ts";

function PartialHomePageDetails() {
  return (
    <>
      <h3 className="cc-basic-heading">Supporting the project</h3>
      <p>
        Cubing Contests is an{" "}
        <a href={C.sourceCodeLink} target="_blank" rel="noopener noreferrer">
          open source project
        </a>{" "}
        created for the benefit of the speedcubing community. Community donations help with the ongoing development and
        maintenance of the project.
      </p>
      <Link href="/donate" className="btn btn-success mt-2">
        Donate
      </Link>

      <h3 className="cc-basic-heading">Contact</h3>
      <p>For general inquiries, send an email to {C.contactEmail}.</p>
    </>
  );
}

export default PartialHomePageDetails;
