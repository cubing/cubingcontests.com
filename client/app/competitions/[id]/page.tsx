import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import myFetch from '~/helpers/myFetch';
import ContestLayout from '@c/ContestLayout';
import ContestTypeBadge from '@c/ContestTypeBadge';
import Country from '@c/Country';
import Competitor from '@c/Competitor';
import { IContest, IContestData } from '@sh/types';
import { ContestState, ContestType } from '@sh/enums';
import C from '@sh/constants';
import { getDateOnly } from '@sh/sharedFunctions';
import { getFormattedDate, getFormattedCoords } from '~/helpers/utilityFunctions';
import { contestTypeOptions } from '~/helpers/multipleChoiceOptions';

const ContestDetailsPage = async ({ params }: { params: { id: string } }) => {
  const { payload } = await myFetch.get(`/competitions/${params.id}`, { revalidate: C.contestInfoRev });
  if (!payload) return <h3 className="mt-4 text-center">Contest not found</h3>;
  const { contest }: { contest: IContest } = payload as IContestData;

  const formattedDate = getFormattedDate(contest.startDate, contest.endDate || null, contest.timezone);
  // Not used for competition type contests
  const formattedTime = contest.meetupDetails
    ? format(utcToZonedTime(contest.meetupDetails.startTime, contest.timezone || 'UTC'), 'H:mm')
    : null;
  const contestType = contestTypeOptions.find((el) => el.value === contest.type)?.label || 'ERROR';
  const startOfDayInLocalTZ = getDateOnly(utcToZonedTime(new Date(), contest.timezone || 'UTC'));
  const start = new Date(contest.startDate);
  const isOngoing =
    contest.state < ContestState.Finished &&
    ((!contest.endDate && start.getTime() === startOfDayInLocalTZ.getTime()) ||
      (contest.endDate && start <= startOfDayInLocalTZ && new Date(contest.endDate) >= startOfDayInLocalTZ));

  const getFormattedDescription = () => {
    // This parses links using markdown link syntax
    const markdownLinkRegex = /(\[[^\]]*\]\(https?:\/\/[^)]*\))/g;
    const tempString = contest.description.replace(markdownLinkRegex, ':::::$1:::::');
    const output = tempString.split(':::::').map((part, index) =>
      markdownLinkRegex.test(part) ? (
        <a key={index} href={/\((https?:\/\/[^)]*)\)/.exec(part)[1]} target="_blank">
          {/\[([^\]]*)\]/.exec(part)[1]}
        </a>
      ) : (
        part
      ),
    );

    return output;
  };

  return (
    <ContestLayout contest={contest} activeTab="details">
      <div className="row w-100 mb-4 mx-0 fs-5">
        <div className="col-md-5 px-0">
          <div className="px-2">
            <div className="mb-3">
              <ContestTypeBadge type={contest.type} />
            </div>
            <p className="mb-2">Date:&#8194;{formattedDate}</p>
            {formattedTime && (
              <p className="mb-2">
                Starts at:&#8194;{formattedTime}
                {contest.type === ContestType.Online ? ' (UTC)' : ''}
              </p>
            )}
            {contest.type !== ContestType.Online && (
              <p className="mb-2">
                City:&#8194;{contest.city}, <Country countryIso2={contest.countryIso2} swapPositions />
              </p>
            )}
            {contest.venue && <p className="mb-2">Venue:&#8194;{contest.venue}</p>}
            {contest.address && <p className="mb-2">Address:&#8194;{contest.address}</p>}
            {contest.latitudeMicrodegrees !== undefined && contest.longitudeMicrodegrees !== undefined && (
              <p className="mb-2">Coordinates:&#8194;{getFormattedCoords(contest)}</p>
            )}
            {contest.contact && (
              <p className="mb-2">
                Contact:&#8194;<span className="fs-6">{contest.contact}</span>
              </p>
            )}
            <p className="mb-2">
              {contest.organizers.length > 1 ? 'Organizers' : 'Organizer'}:&#8194;
              {contest.organizers.map((org, index) => (
                <span key={org.personId} className="d-flex-inline">
                  {index !== 0 && <span>, </span>}
                  <Competitor person={org} noFlag />
                </span>
              ))}
            </p>
            {contest.participants > 0 ? (
              <p className="mb-2">
                Number of participants:&#8194;<b>{contest.participants}</b>
              </p>
            ) : (
              contest.competitorLimit &&
              contest.state < ContestState.Finished && (
                <p className="mb-2">
                  Competitor limit:&#8194;<b>{contest.competitorLimit}</b>
                </p>
              )
            )}
          </div>
        </div>

        <hr className="d-md-none mt-2 mb-3" />

        <div className="col-md-7 px-0">
          <div className="px-2">
            {isOngoing && <p className="mb-4">This contest is currently ongoing</p>}
            {contest.state === ContestState.Finished && (
              <p className="mb-4">The results for this {contestType.toLowerCase()} are currently being checked</p>
            )}
            {contest.description && (
              <p className="lh-base" style={{ whiteSpace: 'pre-wrap' }}>
                <b>Description:</b>&#8194;{getFormattedDescription()}
              </p>
            )}
          </div>
        </div>
      </div>
    </ContestLayout>
  );
};

export default ContestDetailsPage;
