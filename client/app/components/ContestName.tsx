import Link from "next/link";
import type { ContestResponse } from "~/server/db/schema/contests.ts";
import Country from "./Country.tsx";

type Props = {
  contest: Pick<ContestResponse, "competitionId" | "shortName" | "regionCode">;
};

function ContestName({ contest }: Props) {
  return (
    <span className="d-flex gap-2 align-items-center">
      <Country countryIso2={contest.regionCode} noText />

      <Link href={`/competitions/${contest.competitionId}`} prefetch={false}>
        {contest.shortName}
      </Link>
    </span>
  );
}

export default ContestName;
