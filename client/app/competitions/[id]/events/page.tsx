import myFetch from '~/helpers/myFetch';
import CompetitionLayout from '@c/CompetitionLayout';
import { ICompetition } from '@sh/interfaces';
import { RoundProceed, RoundType } from '@sh/enums';
import { roundFormats } from '@sh/roundFormats';
import { roundTypes } from '~/helpers/roundTypes';

const CompetitionEvents = async ({ params }: { params: { id: string } }) => {
  const { payload: competitionData } = await myFetch.get(`/competitions/${params.id}`, { revalidate: 60 });
  if (!competitionData) return <h3 className="mt-4 text-center">Competition not found</h3>;
  const { competition }: { competition: ICompetition } = competitionData;

  const hasNonFinalRound = competition.events.some((ev) => ev.rounds.some((r) => r.proceed));

  return (
    <CompetitionLayout competition={competition} activeTab="events">
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
            {competition.events.map((compEvent) =>
              compEvent.rounds.map((round, roundIndex) => (
                <tr key={round.roundId} className={roundIndex !== 0 ? 'table-active' : ''}>
                  <td>{roundIndex === 0 && compEvent.event.name}</td>
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
    </CompetitionLayout>
  );
};

export default CompetitionEvents;
