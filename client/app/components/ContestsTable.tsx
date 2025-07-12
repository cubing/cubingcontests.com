import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faDiamond, faSquare, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { IContest } from "~/helpers/types.ts";
import { ContestType } from "~/helpers/enums.ts";
import { getBSClassFromColor, getFormattedDate } from "~/helpers/utilityFunctions.ts";
import { contestTypeOptions } from "~/helpers/multipleChoiceOptions.ts";
import ContestTypeBadge from "~/app/components/ContestTypeBadge.tsx";
import Country from "~/app/components/Country.tsx";

type Props = {
  contests: IContest[];
};

const ContestsTable = ({ contests }: Props) => {
  const getShapeIcon = (type: ContestType) =>
    type === ContestType.Competition ? faSquare : type === ContestType.Meetup ? faDiamond : faCircle;

  return (
    <>
      {/* MOBILE VIEW */}

      <div className="d-block d-lg-none border-top border-bottom">
        <ul className="list-group list-group-flush">
          {contests.map((contest: IContest, index: number) => (
            <li
              key={contest.competitionId}
              className={`list-group-item ps-2 ${index % 2 === 1 ? " list-group-item-secondary" : ""}`}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <FontAwesomeIcon
                    icon={getShapeIcon(contest.type)}
                    className={`text-${
                      getBSClassFromColor(
                        contestTypeOptions.find((el) => el.value === contest.type)?.color,
                      )
                    }`}
                    style={{ minWidth: "0.5rem", width: "0.5rem" }}
                  />

                  <Link
                    href={`/competitions/${contest.competitionId}`}
                    prefetch={false}
                    className="link-primary"
                  >
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
                    {contest.city},{" "}
                    <Country
                      countryIso2={contest.countryIso2}
                      swapPositions
                      shorten
                    />
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
          ))}
        </ul>
      </div>

      {/* DESKTOP VIEW */}

      <div className="d-none d-lg-block mb-5 table-responsive">
        <table className="table table-hover text-nowrap">
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
            {contests.map((contest: IContest) => (
              <tr key={contest.competitionId}>
                <td>{getFormattedDate(contest.startDate, contest.endDate)}</td>
                <td>
                  <Link
                    href={`/competitions/${contest.competitionId}`}
                    prefetch={false}
                    className="link-primary"
                  >
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
};

export default ContestsTable;
