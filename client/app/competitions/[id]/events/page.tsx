import { ssrFetch } from '~/helpers/fetchUtils';
import ContestLayout from '@c/ContestLayout';
import EventTitle from '@c/EventTitle';
import { IContest } from '@sh/types';
import { RoundProceed, RoundType } from '@sh/enums';
import { roundFormats } from '@sh/roundFormats';
import { roundTypes } from '~/helpers/roundTypes';
import { getFormattedTime } from '@sh/sharedFunctions';

const ContestEventsPage = async ({ params }: { params: { id: string } }) => {
  const { payload: contestData } = await ssrFetch(`/competitions/${params.id}`);
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
              <th scope="col">Time Limit</th>
              <th scope="col">Cutoff</th>
              {hasNonFinalRound && <th scope="col">Proceed</th>}
            </tr>
          </thead>
          <tbody>
            {contest.events.map((compEvent) =>
              compEvent.rounds.map((round, roundIndex) => {
                const cutoffText = round.cutoff
                  ? `${round.cutoff.numberOfAttempts} ${round.cutoff.numberOfAttempts === 1 ? 'attempt' : 'attempts'
                  } to get < ${getFormattedTime(round.cutoff.attemptResult, { event: compEvent.event })}`
                  : '';

                return (
                  <tr key={round.roundId} className={roundIndex !== 0 ? 'table-active' : ''}>
                    <td>{roundIndex === 0 &&
                      <EventTitle
                        event={compEvent.event}
                        fontSize="6"
                        noMargin
                        showIcon
                        linkToRankings
                        showDescription
                      />
                    }</td>
                    <td>{roundTypes[round.roundTypeId].label}</td>
                    <td>{roundFormats.find((rf) => rf.value === round.format).label}</td>
                    <td>
                      {round.timeLimit
                        ? getFormattedTime(round.timeLimit.centiseconds, { event: compEvent.event }) +
                        (round.timeLimit.cumulativeRoundIds.length > 0 ? ' cumulative' : '')
                        : ''}
                    </td>
                    <td>{cutoffText}</td>
                    {hasNonFinalRound && (
                      <td>
                        {round.roundTypeId !== RoundType.Final &&
                          `Top ${round.proceed.value}${round.proceed.type === RoundProceed.Percentage ? '%' : ''
                          } advance to next round`}
                      </td>
                    )}
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
    </ContestLayout>
  );
};

export default ContestEventsPage;
