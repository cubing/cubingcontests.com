import myFetch from '~/helpers/myFetch';
import { IEventRecords, IPerson } from '@sh/interfaces';
import { formatTime, getCountry, getSolves } from '~/helpers/utilityFunctions';
import { EventFormat } from '@sh/enums';

const Records = async () => {
  // Revalidate every 12 hours
  const eventRecords = await myFetch.get('/results/records/WR', { revalidate: 43200 });

  const getCompetitorCountries = (persons: IPerson[]): string => {
    const countries: string[] = [];

    for (const person of persons) {
      if (!countries.includes(person.countryId)) {
        countries.push(person.countryId);
      }
    }

    return countries.map((el) => getCountry(el)).join(' & ');
  };

  return (
    <>
      <h2 className="mb-4 text-center">Records</h2>
      {!eventRecords?.errors &&
        eventRecords.map((eventRecord: IEventRecords) => (
          <div key={eventRecord.event.eventId} className="mb-3">
            <h3 className="mx-2">{eventRecord.event.name}</h3>
            <div className="flex-grow-1 table-responsive">
              <table className="table table-hover table-responsive text-nowrap">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Result</th>
                    <th>{eventRecord.event.format === EventFormat.TeamTime ? 'Citizens of' : 'Citizen of'}</th>
                    <th>Solves</th>
                  </tr>
                </thead>
                <tbody>
                  {eventRecord.bestRecords.map((bestRecord) => (
                    <tr key={bestRecord.result.personId}>
                      <td>Single</td>
                      <td>{bestRecord.persons.map((el) => el.name).join(' & ')}</td>
                      <td>{formatTime(eventRecord.event, bestRecord.result.best)}</td>
                      <td>{getCompetitorCountries(bestRecord.persons)}</td>
                      <td></td>
                    </tr>
                  ))}
                  {eventRecord.averageRecords.map((avgRecord) => (
                    <tr key={avgRecord.result.personId}>
                      <td>Average</td>
                      <td>{avgRecord.persons.map((el) => el.name).join(' & ')}</td>
                      <td>{formatTime(eventRecord.event, avgRecord.result.average, true)}</td>
                      <td>{getCompetitorCountries(avgRecord.persons)}</td>
                      <td>{getSolves(eventRecord.event, avgRecord.result.attempts)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </>
  );
};

export default Records;
