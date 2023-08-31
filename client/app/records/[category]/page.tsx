import Link from 'next/link';
import myFetch from '~/helpers/myFetch';
import Country from '~/app/components/Country';
import Solves from '~/app/components/Solves';
import { IEvent, IRecord, IEventRecords, IPerson } from '@sh/interfaces';
import { formatTime, getFormattedDate } from '~/helpers/utilityFunctions';
import RecordsCategoryTabs from '~/app/components/RecordsCategoryTabs';
import { recordsCategories } from '~/helpers/recordsCategories';

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
  const getRecordType = (record: IRecord): string => {
    if (record.type === 'single') return 'Single';
    else if (record.type === 'average') return 'Average';
    else if (record.type === 'mean') return 'Mean';
  };

  const getTime = (record: IRecord, event: IEvent): string => {
    if (record.type === 'single') return formatTime(record.result.best, event);
    return formatTime(record.result.average, event);
  };

  const getId = (record: IRecord, person?: IPerson): string => {
    return record.type + (record.result as any)._id + person?.personId;
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

                <div className="d-block d-lg-none my-3 border-top border-bottom">
                  <ul className="list-group list-group-flush">
                    {records.map((record) => (
                      <li
                        key={getId(record)}
                        className="d-flex flex-column gap-3 py-3 list-group-item list-group-item-dark"
                      >
                        <div className="d-flex justify-content-between">
                          <span>
                            <b>{getTime(record, event)}</b>&#8194;{getRecordType(record)}
                          </span>
                          {record.competition ? (
                            <Link href={`/competitions/${record.competition.competitionId}`}>
                              {getFormattedDate(record.result.date)}
                            </Link>
                          ) : (
                            <span>{getFormattedDate(record.result.date)}</span>
                          )}
                        </div>
                        <div className="d-flex flex-column gap-2">
                          {record.persons.map((person) => (
                            <span key={person.personId} className="d-flex align-items-center">
                              {person.name}&nbsp;
                              <Country countryIso2={person.countryIso2} noText />
                            </span>
                          ))}
                        </div>
                        {showSolves && <Solves event={event} attempts={record.result.attempts} />}
                        {hasLink && (
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
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="d-none d-lg-block flex-grow-1 table-responsive">
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
                          <tr key={getId(record, person)}>
                            <td>{!i && getRecordType(record)}</td>
                            <td>{person.name}</td>
                            <td>{!i && getTime(record, event)}</td>
                            <td>
                              <Country countryIso2={person.countryIso2} />
                            </td>
                            <td>{!i && getFormattedDate(record.result.date)}</td>
                            {hasCompetition && (
                              <td>
                                {!i && (
                                  <Link href={`/competitions/${record.competition.competitionId}`}>
                                    {record.competition.name}
                                  </Link>
                                )}
                              </td>
                            )}
                            {showSolves && <td>{!i && <Solves event={event} attempts={record.result.attempts} />}</td>}
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
