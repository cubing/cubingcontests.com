import myFetch from '~/helpers/myFetch';
import { utcToZonedTime, format } from 'date-fns-tz';
import ContestLayout from '~/app/components/ContestLayout';
import ContestTypeBadge from '@c/ContestTypeBadge';
import Country from '@c/Country';
import { IContest } from '@sh/interfaces';
import { ContestState, ContestType } from '@sh/enums';
import { getFormattedDate, getFormattedCoords } from '~/helpers/utilityFunctions';
import { areIntervalsOverlapping, endOfToday, startOfToday } from 'date-fns';
import { contestTypeOptions } from '~/helpers/multipleChoiceOptions';
import Competitor from '~/app/components/Competitor';

const ContestDetailsPage = async ({ params }: { params: { id: string } }) => {
  const { payload: contestData } = await myFetch.get(`/competitions/${params.id}`, { revalidate: 60 });
  if (!contestData) return <h3 className="mt-4 text-center">Contest not found</h3>;
  const { contest }: { contest: IContest } = contestData;

  const formattedDate = getFormattedDate(contest.startDate, contest.endDate ? contest.endDate : null);
  // Not used for competition type contests
  const formattedTime =
    contest.type === ContestType.Competition
      ? null
      : format(utcToZonedTime(contest.startDate, contest.timezone || 'UTC'), 'H:mm');

  const contestType = contestTypeOptions.find((el) => el.value === contest.type)?.label || 'ERROR';
  const isOngoing =
    contest.state < ContestState.Finished &&
    areIntervalsOverlapping(
      { start: new Date(contest.startDate), end: new Date(contest.endDate || contest.startDate) },
      { start: startOfToday(), end: endOfToday() },
      { inclusive: true },
    );

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
            {contest.latitudeMicrodegrees && contest.longitudeMicrodegrees && (
              <p className="mb-2">Coordinates:&#8194;{getFormattedCoords(contest)}</p>
            )}
            {contest.contact && (
              <p className="mb-2">
                Contact:&#8194;<span style={{ whiteSpace: 'nowrap' }}>{contest.contact}</span>
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
            {contest.state < ContestState.Published && contest.competitorLimit && (
              <p className="mb-2">
                Competitor limit:&#8194;<b>{contest.competitorLimit}</b>
              </p>
            )}
            {contest.participants > 0 && (
              <p className="mb-2">
                Number of participants:&#8194;<b>{contest.participants}</b>
              </p>
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
