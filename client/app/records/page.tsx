import myFetch from '~/helpers/myFetch';
import { IEventRecords, IPerson } from '@sh/interfaces';
import { formatTime, getCountry, getSolves, getFormattedDate } from '~/helpers/utilityFunctions';
import { EventGroup } from '@sh/enums';

const Records = async () => {
  const { payload: eventRecords } = await myFetch.get('/results/records/WR', { revalidate: 600 });

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
        <p className="mx-2 fs-5">No contests have been held yet</p>
      ) : (
        eventRecords.map(({ event, avgRecords, bestRecords }: IEventRecords) => {
          const isGroupEvent = event.groups.includes(EventGroup.Team);
          const hasAverage = avgRecords.length > 0;
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
                      {hasAverage && <th>Solves</th>}
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
                        <td colSpan={hasAverage ? 2 : 1}>{getFormattedDate(bestRecord.result.date)}</td>
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
        })
      )}
    </>
  );
};

export default Records;
