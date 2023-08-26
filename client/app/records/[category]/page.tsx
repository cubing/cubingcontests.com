import myFetch from '~/helpers/myFetch';
import { IEventRecords, IPerson } from '@sh/interfaces';
import { formatTime, getCountry, getSolves, getFormattedDate } from '~/helpers/utilityFunctions';
import { EventGroup } from '@sh/enums';
import RecordsCategoryTabs from '~/app/components/RecordsCategoryTabs';
import { recordsCategories } from '~/helpers/recordsCategories';

const Records = async ({ params }: { params: { category: string } }) => {
  // Refreshes records every 5 minutes
  const { payload: eventRecords }: { payload?: IEventRecords[] } = await myFetch.get('/results/records/WR', {
    revalidate: 300,
  });

  // Gets just the events for the current records category
  const filteredEventRecords = eventRecords.filter((er) =>
    er.event.groups.includes(recordsCategories.find((rc) => rc.value === params.category).group),
  );

  const getCompetitorCountries = (persons: IPerson[]): string => {
    const countries: string[] = [];

    for (const person of persons) {
      if (!countries.includes(person.countryIso2)) {
        countries.push(person.countryIso2);
      }
    }

    return countries.map((el) => getCountry(el)).join(' & ');
  };

  return (
    <>
      <h2 className="mb-4 text-center">Records</h2>

      {eventRecords?.length === 0 ? (
        <p className="mx-2 fs-5">No records have been set yet</p>
      ) : (
        <>
          <RecordsCategoryTabs eventRecords={eventRecords} category={params.category} />

          {filteredEventRecords.map(({ event, avgRecords, bestRecords }: IEventRecords) => {
            const isGroupEvent = event.groups.includes(EventGroup.Team);
            const hasVideoLink =
              bestRecords.some((el) => el.result.videoLink) || avgRecords.some((el) => el.result.videoLink);

            return (
              <div key={event.eventId} className="mb-3">
                <h3 className="mx-2">{event.name}</h3>
                <div className="flex-grow-1 table-responsive">
                  <table className="table table-hover table-responsive text-nowrap">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>{isGroupEvent ? 'Names' : 'Name'}</th>
                        <th>Result</th>
                        <th>{isGroupEvent ? 'Citizens of' : 'Citizen of'}</th>
                        <th>Date</th>
                        <th>Solves</th>
                        {hasVideoLink && <th>Link</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {bestRecords.map((bestRecord) => (
                        <tr key={bestRecord.result.personIds.join()}>
                          <td>Single</td>
                          <td>{bestRecord.persons.map((el) => el.name).join(' & ')}</td>
                          <td>{formatTime(bestRecord.result.best, event)}</td>
                          <td>{getCompetitorCountries(bestRecord.persons)}</td>
                          <td>{getFormattedDate(bestRecord.result.date)}</td>
                          <td>{getSolves(event, bestRecord.result.attempts)}</td>
                          {hasVideoLink && (
                            <td>
                              <a href={bestRecord.result.videoLink} target="_blank">
                                Video
                              </a>
                            </td>
                          )}
                        </tr>
                      ))}
                      {avgRecords.map((avgRecord) => (
                        <tr key={avgRecord.result.personIds.join()}>
                          <td>Average</td>
                          <td>{avgRecord.persons.map((el) => el.name).join(' & ')}</td>
                          <td>{formatTime(avgRecord.result.average, event, { isAverage: true })}</td>
                          <td>{getCompetitorCountries(avgRecord.persons)}</td>
                          <td>{getFormattedDate(avgRecord.result.date)}</td>
                          <td>{getSolves(event, avgRecord.result.attempts)}</td>
                          {hasVideoLink && (
                            <td>
                              <a href={avgRecord.result.videoLink} target="_blank">
                                Video
                              </a>
                            </td>
                          )}
                        </tr>
                      ))}
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
