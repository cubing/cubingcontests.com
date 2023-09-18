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

const Competition = async ({ params }: { params: { id: string } }) => {
  const { payload: contestData } = await myFetch.get(`/competitions/${params.id}`, { revalidate: 60 });
  if (!contestData) return <h3 className="mt-4 text-center">Contest not found</h3>;
  const { competition }: { competition: IContest } = contestData;

  const formattedDate = getFormattedDate(competition.startDate, competition.endDate ? competition.endDate : null);
  // Not used for competition type contests
  const formattedTime =
    competition.type === ContestType.Competition
      ? null
      : format(utcToZonedTime(competition.startDate, competition.timezone || 'UTC'), 'H:mm');

  const competitionType = contestTypeOptions.find((el) => el.value === competition.type)?.label || 'ERROR';
  const isOngoing =
    competition.state < ContestState.Finished &&
    areIntervalsOverlapping(
      { start: new Date(competition.startDate), end: new Date(competition.endDate || competition.startDate) },
      { start: startOfToday(), end: endOfToday() },
      { inclusive: true },
    );

  const getFormattedDescription = () => {
    // This parses links using markdown link syntax
    const markdownLinkRegex = /(\[[^\]]*\]\(https?:\/\/[^)]*\))/g;
    const tempString = competition.description.replace(markdownLinkRegex, ':::::$1:::::');
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
    <ContestLayout competition={competition} activeTab="details">
      {/* For some reason if you remove w-100, it wants to be even wider and causes horizontal scrolling :/ */}
      <div className="row w-100 mb-4 px-2 fs-5">
        <div className="col-md-5">
          <div className="mb-3">
            <ContestTypeBadge type={competition.type} />
          </div>
          <p className="mb-2">Date:&#8194;{formattedDate}</p>
          {formattedTime && (
            <p className="mb-2">
              Starts at:&#8194;{formattedTime}
              {competition.type === ContestType.Online ? ' (UTC)' : ''}
            </p>
          )}
          {competition.type !== ContestType.Online && (
            <p className="mb-2">
              City:&#8194;{competition.city}, <Country countryIso2={competition.countryIso2} swapPositions />
            </p>
          )}
          {competition.venue && <p className="mb-2">Venue:&#8194;{competition.venue}</p>}
          {competition.address && <p className="mb-2">Address:&#8194;{competition.address}</p>}
          {competition.latitudeMicrodegrees && competition.longitudeMicrodegrees && (
            <p className="mb-2">Coordinates:&#8194;{getFormattedCoords(competition)}</p>
          )}
          {competition.contact && (
            <p className="mb-2">
              Contact:&#8194;<span style={{ whiteSpace: 'nowrap' }}>{competition.contact}</span>
            </p>
          )}
          <p className="mb-2">
            {competition.organizers.length > 1 ? 'Organizers' : 'Organizer'}:&#8194;
            {competition.organizers.map((org, index) => (
              <span key={org.personId} className="d-flex-inline">
                {index !== 0 && <span>, </span>}
                <Competitor person={org} noFlag />
              </span>
            ))}
          </p>
          {competition.state < ContestState.Published && competition.competitorLimit && (
            <p className="mb-2">
              Competitor limit:&#8194;<b>{competition.competitorLimit}</b>
            </p>
          )}
          {competition.participants > 0 && (
            <p className="mb-2">
              Number of participants:&#8194;<b>{competition.participants}</b>
            </p>
          )}
        </div>
        <hr className="d-md-none mt-2 mb-3" />
        <div className="col-md-7">
          {isOngoing && <p className="mb-4">This contest is currently ongoing</p>}
          {competition.state === ContestState.Finished && (
            <p className="mb-4">The results for this {competitionType.toLowerCase()} are currently being checked</p>
          )}
          {competition.description && (
            <p className="lh-base" style={{ whiteSpace: 'pre-wrap' }}>
              <b>Description:</b>&#8195;{getFormattedDescription()}
            </p>
          )}
        </div>
      </div>
    </ContestLayout>
  );
};

export default Competition;
