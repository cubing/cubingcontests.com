import myFetch from '~/helpers/myFetch';
import { IEventRecords } from '@sh/interfaces';
import { formatTime, getSolves, getFormattedDate } from '~/helpers/utilityFunctions';
import RecordsCategoryTabs from '~/app/components/RecordsCategoryTabs';
import { recordsCategories } from '~/helpers/recordsCategories';
import Country from '~/app/components/Country';

const Records = async ({ params }: { params: { category: string } }) => {
  // Refreshes records every 5 minutes
  const { payload: eventRecords }: { payload?: IEventRecords[] } = await myFetch.get('/results/records/WR', {
    revalidate: 300,
  });

  // Gets just the events for the current records category
  const filteredEventRecords = eventRecords?.filter((er) =>
    er.event.groups.includes(recordsCategories.find((rc) => rc.value === params.category).group),
  );

  // THIS IS A TEMPORARY SOLUTION UNTIL I18N IS ADDED
  const getRecordType = (type: 'single' | 'average' | 'mean'): string => {
    if (type === 'single') return 'Single';
    else if (type === 'average') return 'Average';
    else if (type === 'mean') return 'Mean';
  };

  return (
    <>
      <h2 className="mb-4 text-center">Records</h2>

      {!eventRecords || eventRecords.length === 0 ? (
        <p className="mx-2 fs-5">No records have been set yet</p>
      ) : (
        <>
          <RecordsCategoryTabs eventRecords={eventRecords} category={params.category} />

          {filteredEventRecords.map(({ event, records }: IEventRecords) => {
            const showSolves = records.some((el) => el.result.attempts.length > 1);
            const hasCompetition = records.some((el) => el.competition);
            const hasLink = records.some((el) => el.result.videoLink || el.result.discussionLink);

            return (
              <div key={event.eventId} className="mb-3">
                <h3 className="mx-2">{event.name}</h3>
                <div className="flex-grow-1 table-responsive">
                  <table className="table table-hover table-responsive text-nowrap">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Name</th>
                        <th>Result</th>
                        <th>Representing</th>
                        <th>Date</th>
                        {hasCompetition && <th>Competition</th>}
                        {showSolves && <th>Solves</th>}
                        {hasLink && <th>Links</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) =>
                        record.persons.map((person, i) => (
                          <tr key={record.type + (record.result as any)._id + person.personId}>
                            <td>{!i && getRecordType(record.type)}</td>
                            <td>{person.name}</td>
                            <td>
                              {!i &&
                                formatTime(
                                  record.type === 'single' ? record.result.best : record.result.average,
                                  event,
                                )}
                            </td>
                            <td>
                              <Country countryIso2={person.countryIso2} />
                            </td>
                            <td>{!i && getFormattedDate(record.result.date)}</td>
                            {hasCompetition && (
                              <td>
                                {!i && (
                                  <a href={`/competitions/${record.competition.competitionId}`}>
                                    {record.competition.name}
                                  </a>
                                )}
                              </td>
                            )}
                            {showSolves && <td>{!i && getSolves(event, record.result.attempts)}</td>}
                            {hasLink && (
                              <td>
                                {!i && (
                                  <div className="d-flex gap-2">
                                    {record.result.videoLink && (
                                      <a href={record.result.videoLink} target="_blank">
                                        Video
                                      </a>
                                    )}
                                    {record.result.discussionLink && (
                                      <a href={record.result.discussionLink} target="_blank">
                                        Discussion
                                      </a>
                                    )}
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </>
      )}
    </>
  );
};

export default Records;
