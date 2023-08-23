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

      {!eventRecords ? (
        <p className="mx-2 fs-5">No contests have been held yet</p>
      ) : (
        eventRecords.map((eventRecord: IEventRecords) => {
          const isGroupEvent = eventRecord.event.groups.includes(EventGroup.Team);

          return (
            <div key={eventRecord.event.eventId} className="mb-3">
              <h3 className="mx-2">{eventRecord.event.name}</h3>
              <div className="flex-grow-1 table-responsive">
                <table className="table table-hover table-responsive text-nowrap">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>{isGroupEvent ? 'Name' : 'Names'}</th>
                      <th>Result</th>
                      <th>{isGroupEvent ? 'Citizen of' : 'Citizens of'}</th>
                      <th>Date</th>
                      <th>Solves</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventRecord.bestRecords.map((bestRecord) => (
                      <tr key={bestRecord.result.personIds.join()}>
                        <td>Single</td>
                        <td>{bestRecord.persons.map((el) => el.name).join(' & ')}</td>
                        <td>{formatTime(bestRecord.result.best, eventRecord.event)}</td>
                        <td>{getCompetitorCountries(bestRecord.persons)}</td>
                        <td>{getFormattedDate(bestRecord.result.date)}</td>
                        <td></td>
                      </tr>
                    ))}
                    {eventRecord.averageRecords.map((avgRecord) => (
                      <tr key={avgRecord.result.personIds.join()}>
                        <td>Average</td>
                        <td>{avgRecord.persons.map((el) => el.name).join(' & ')}</td>
                        <td>{formatTime(avgRecord.result.average, eventRecord.event, { isAverage: true })}</td>
                        <td>{getCompetitorCountries(avgRecord.persons)}</td>
                        <td>{getFormattedDate(avgRecord.result.date)}</td>
                        <td>{getSolves(eventRecord.event, avgRecord.result.attempts)}</td>
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
