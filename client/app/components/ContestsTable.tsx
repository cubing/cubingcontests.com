import Link from 'next/link';
import { FaCircle } from 'react-icons/fa';
import ContestTypeBadge from '@c/ContestTypeBadge';
import Country from '@c/Country';
import { IContest } from '@sh/types';
import { ContestType } from '@sh/enums';
import { getBSClassFromColor, getFormattedDate } from '~/helpers/utilityFunctions';
import { contestTypeOptions } from '~/helpers/multipleChoiceOptions';

const ContestsTable = ({ contests }: { contests: IContest[] }) => {
  return (
    <>
      {/* MOBILE VIEW */}

      <div className="d-block d-lg-none border-top border-bottom">
        <ul className="list-group list-group-flush">
          {contests.map((contest: IContest, index: number) => (
            <li
              key={contest.competitionId}
              className={`list-group-item ps-2 ${index % 2 === 1 ? ' list-group-item-dark' : ''}`}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <FaCircle
                    className={`text-${getBSClassFromColor(
                      contestTypeOptions.find((el) => el.value === contest.type).color,
                    )}`}
                    style={{ minWidth: '0.5rem', width: '0.5rem' }}
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
                  {contest.type !== ContestType.Online ? (
                    <span>
                      {contest.city}, <Country countryIso2={contest.countryIso2} swapPositions shorten />
                    </span>
                  ) : (
                    'Online'
                  )}
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
              <th scope="col">Participants</th>
            </tr>
          </thead>
          <tbody>
            {contests.map((contest: IContest) => (
              <tr key={contest.competitionId}>
                <td>{getFormattedDate(contest.startDate, contest.endDate, contest.timezone)}</td>
                <td>
                  <Link href={`/competitions/${contest.competitionId}`} prefetch={false} className="link-primary">
                    {contest.shortName}
                  </Link>
                </td>
                <td>
                  {contest.type !== ContestType.Online && (
                    <span>
                      {contest.city}, <Country countryIso2={contest.countryIso2} swapPositions />
                    </span>
                  )}
                </td>
                <td>
                  <ContestTypeBadge type={contest.type} />
                </td>
                <td>{contest.participants || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ContestsTable;
