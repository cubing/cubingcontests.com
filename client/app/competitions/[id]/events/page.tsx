import myFetch from '~/helpers/myFetch';
import ContestLayout from '@c/ContestLayout';
import EventTitle from '@c/EventTitle';
import { IContest } from '@sh/interfaces';
import { RoundProceed, RoundType } from '@sh/enums';
import { roundFormats } from '@sh/roundFormats';
import C from '@sh/constants';
import { roundTypes } from '~/helpers/roundTypes';

const ContestEventsPage = async ({ params }: { params: { id: string } }) => {
  const { payload: contestData } = await myFetch.get(`/competitions/${params.id}`, {
    revalidate: C.contestInfoRevalidate,
  });
  if (!contestData) return <h3 className="mt-4 text-center">Contest not found</h3>;
  const { contest }: { contest: IContest } = contestData;

  const hasNonFinalRound = contest.events.some((ev) => ev.rounds.some((r) => r.proceed));

  return (
    <ContestLayout contest={contest} activeTab="events">
      <div className="flex-grow-1 mb-5 table-responsive">
        <table className="table table-hover text-nowrap">
          <thead>
            <tr>
              <th scope="col">Event</th>
              <th scope="col">Round</th>
              <th scope="col">Format</th>
              {hasNonFinalRound && <th scope="col">Proceed</th>}
            </tr>
          </thead>
          <tbody>
            {contest.events.map((compEvent) =>
              compEvent.rounds.map((round, roundIndex) => (
                <tr key={round.roundId} className={roundIndex !== 0 ? 'table-active' : ''}>
                  <td>{roundIndex === 0 && <EventTitle event={compEvent.event} fontSize="6" noMargin showIcon />}</td>
                  <td>{roundTypes[round.roundTypeId].label}</td>
                  <td>{roundFormats[round.format].label}</td>
                  {hasNonFinalRound && (
                    <td>
                      {round.roundTypeId !== RoundType.Final &&
                        `Top ${round.proceed.value}${
                          round.proceed.type === RoundProceed.Percentage ? '%' : ''
                        } advance to next round`}
                    </td>
                  )}
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </ContestLayout>
  );
};

export default ContestEventsPage;
