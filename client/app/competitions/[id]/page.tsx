import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import Markdown from "react-markdown";
import { ssrFetch } from "~/helpers/DELETEfetchUtils";
import ContestLayout from "~/app/competitions/ContestLayout.tsx";
import ContestTypeBadge from "~/app/components/ContestTypeBadge.tsx";
import Country from "~/app/components/Country.tsx";
import Competitor from "~/app/components/Competitor.tsx";
import { IContestData } from "~/helpers/types.ts";
import { ContestState, ContestType } from "~/helpers/enums.ts";
import { getDateOnly } from "~/helpers/sharedFunctions.ts";
import { getFormattedDate } from "~/helpers/utilityFunctions.ts";
import WcaCompAdditionalDetails from "~/app/components/WcaCompAdditionalDetails.tsx";
import TempClientComponent from "~/app/competitions/[id]/TempClientComponent";

type Props = {
  params: Promise<{ id: string }>;
};

const ContestDetailsPage = async ({ params }: Props) => {
  const { id } = await params;
  const contestDataResponse = await ssrFetch<IContestData>(`/competitions/${id}`);
  if (!contestDataResponse.success) return <h3 className="mt-4 text-center">Error while loading contest</h3>;
  const { contest } = contestDataResponse.data;

  const formattedDate = getFormattedDate(contest.startDate, contest.endDate || null);
  // Not used for competition type contests
  const formattedTime = contest.meetupDetails
    ? formatInTimeZone(contest.meetupDetails.startTime, contest.meetupDetails.timeZone, "H:mm")
    : null;
  const startOfDayInVenueTZ = getDateOnly(toZonedTime(new Date(), contest.meetupDetails?.timeZone ?? "UTC"))!;
  const start = new Date(contest.startDate);
  const isOngoing = contest.state < ContestState.Finished &&
    ((!contest.endDate && start.getTime() === startOfDayInVenueTZ.getTime()) ||
      (contest.endDate && start <= startOfDayInVenueTZ && new Date(contest.endDate) >= startOfDayInVenueTZ));

  const getFormattedCoords = () => {
    const latitude = (contest.latitudeMicrodegrees / 1000000).toFixed(6);
    const longitude = (contest.longitudeMicrodegrees / 1000000).toFixed(6);

    return (
      <a href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=18`} target="_blank">
        {latitude}, {longitude}
      </a>
    );
  };

  return (
    <ContestLayout contest={contest} activeTab="details">
      <div className="row w-100 mx-0 fs-5">
        <div className="col-md-5 px-0">
          <div className="px-2">
            <div className="mb-3">
              <ContestTypeBadge type={contest.type} />
            </div>
            <p className="mb-2">Date:&#8194;{formattedDate}</p>
            {formattedTime && <p className="mb-2">Starts at:&#8194;{formattedTime}</p>}
            <p className="mb-2">
              City:&#8194;{contest.city}, <Country countryIso2={contest.countryIso2} swapPositions />
            </p>
            {/* Venue and address may be undefined for some old WCA competitions */}
            {contest.venue && <p className="mb-2">Venue:&#8194;{contest.venue}</p>}
            {contest.address && <p className="mb-2">Address:&#8194;{contest.address}</p>}
            <p className="mb-2">Coordinates:&#8194;{getFormattedCoords()}</p>
            {contest.contact && (
              <p className="mb-2">
                Contact:&#8194;<span className="fs-6">{contest.contact}</span>
              </p>
            )}
            <p className="mb-2">
              {contest.organizers.length > 1 ? "Organizers" : "Organizer"}:&#8194;
              {contest.organizers.map((org, index) => (
                <span key={org.personId} className="d-flex-inline">
                  {index !== 0 && <span className="me-1">,</span>}
                  <Competitor person={org} noFlag />
                </span>
              ))}
            </p>
            {contest.participants > 0
              ? (
                <p className="mb-2">
                  Number of participants:&#8194;<b>{contest.participants}</b>
                </p>
              )
              : (
                contest.competitorLimit && (
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
            <TempClientComponent contest={contest} />

            {contest.state === ContestState.Created
              ? (
                <p className="mb-4">
                  This contest is currently awaiting approval
                </p>
              )
              : isOngoing
              ? <p className="mb-4">This contest is currently ongoing</p>
              : contest.state === ContestState.Finished
              ? (
                <p className="mb-4">
                  The results for this contest are currently being checked
                </p>
              )
              : contest.state === ContestState.Removed
              ? (
                <p className="mb-4 text-danger">
                  THIS CONTEST HAS BEEN REMOVED!
                </p>
              )
              : undefined}

            {contest.type === ContestType.WcaComp && (
              <WcaCompAdditionalDetails
                name={contest.name}
                competitionId={contest.competitionId}
              />
            )}

            {contest.description && (
              <>
                <p className="fw-bold">Description:</p>
                <div style={{ overflowX: "auto" }}>
                  <Markdown>{contest.description}</Markdown>
                </div>
                {contest.queuePosition && (
                  <p className="mt-5">
                    Current position in queue: <b>{contest.queuePosition}</b>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ContestLayout>
  );
};

export default ContestDetailsPage;
