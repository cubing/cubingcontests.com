import { faCircle, faDiamond, faSquare, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import ContestTypeBadge from "~/app/components/ContestTypeBadge.tsx";
import Country from "~/app/components/Country.tsx";
import { contestTypeOptions } from "~/helpers/multipleChoiceOptions.ts";
import type { ContestType } from "~/helpers/types.ts";
import { getFormattedDate } from "~/helpers/utilityFunctions.ts";

type Props = {
  contests: {
    competitionId: string;
    shortName: string;
    type: ContestType;
    city: string;
    countryIso2: string;
    startDate: Date;
    endDate: Date;
    participants: number;
  }[];
};

function ContestsTable({ contests }: Props) {
  const getShapeIcon = (type: ContestType) => (type === "comp" ? faSquare : type === "meetup" ? faDiamond : faCircle);

  return (
    <>
      {/* MOBILE VIEW */}

      <div className="d-block d-lg-none border-bottom border-top">
        <ul className="list-group list-group-flush">
          {contests.map((contest, index) => {
            const contestType = contestTypeOptions.find((ct) => ct.value === contest.type);

            return (
              <li
                key={contest.competitionId}
                className={`list-group-item ps-2 ${index % 2 === 1 ? "list-group-item-secondary" : ""}`}
              >
                <div className="d-flex justify-content-between mb-3 align-items-center">
                  <div className="d-flex gap-2 align-items-center">
                    <FontAwesomeIcon
                      icon={getShapeIcon(contest.type)}
                      style={{ minWidth: "0.5rem", width: "0.5rem", color: contestType?.color }}
                    />

                    <Link href={`/competitions/${contest.competitionId}`} prefetch={false} className="link-primary">
                      {contest.shortName}
                    </Link>
                  </div>

                  <p className="ms-2 mb-0 text-end">
                    <b>{getFormattedDate(contest.startDate, contest.endDate)}</b>
                  </p>
                </div>
                <div className="d-flex justify-content-between gap-3">
                  <div className="ms-2">
                    <span>
                      {contest.city}, <Country countryIso2={contest.countryIso2} swapPositions shorten />
                    </span>
                  </div>
                  <div className="flex-shrink-0 text-end">
                    {contest.participants > 0 && (
                      <span>
                        Participants: <b>{contest.participants}</b>
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* DESKTOP VIEW */}

      <div className="d-none d-lg-block table-responsive mb-5">
        <table className="table-hover table text-nowrap">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Name</th>
              <th scope="col">Place</th>
              <th scope="col">Type</th>
              <th scope="col">
                <FontAwesomeIcon
                  icon={faUserGroup}
                  title="Number of participants"
                  aria-label="Number of participants"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {contests.map((contest) => (
              <tr key={contest.competitionId}>
                <td>{getFormattedDate(contest.startDate, contest.endDate)}</td>
                <td>
                  <Link href={`/competitions/${contest.competitionId}`} prefetch={false} className="link-primary">
                    {contest.shortName}
                  </Link>
                </td>
                <td>
                  {contest.city}, <Country countryIso2={contest.countryIso2} swapPositions />
                </td>
                <td>
                  <ContestTypeBadge type={contest.type} />
                </td>
                <td>{contest.participants || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default ContestsTable;
