"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { use } from "react";
import Markdown from "react-markdown";
import { slugPath } from "~/helpers/utility-functions.ts";

type Props = {
  modInstructionsPromise: Promise<string | null>;
  modInstructionsDescriptionPromise: Promise<string | null>;
};

function ModInstructionsSection({ modInstructionsPromise, modInstructionsDescriptionPromise }: Props) {
  const { slug }: { slug: string } = useParams();

  const modInstructions = use(modInstructionsPromise);
  if (!modInstructions) return;

  const modInstructionsDescription = use(modInstructionsDescriptionPromise);

  return (
    <>
      <h3 className="rr-basic-heading">Holding a contest</h3>

      {modInstructionsDescription && <Markdown>{modInstructionsDescription}</Markdown>}

      <Link href={slugPath(slug, "/moderator-instructions")} prefetch={false} className="btn btn-secondary">
        Moderator Instructions
      </Link>
    </>
  );
}

export default ModInstructionsSection;
