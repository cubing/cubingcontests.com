'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import myFetch from '~/helpers/myFetch';
import ErrorMessages from '@c/UI/ErrorMessages';
import Time from '@c/Time';
import Solves from '@c/Solves';
import Competitors from '@c/Competitors';
import { IFeResult, IRecordType } from '@sh/types';
import { getFormattedDate, shortenEventName } from '~/helpers/utilityFunctions';
import C from '@sh/constants';

const ManageResultsPage = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [recordTypes, setRecordTypes] = useState<IRecordType[]>();
  const [results, setResults] = useState<IFeResult[]>([]);

  useEffect(() => {
    myFetch.get('/results/submission-based', { authorize: true }).then(({ payload, errors }) => {
      if (errors) setErrorMessages(errors);
      else setResults(payload);
    });

    myFetch.get('/record-types', { authorize: true }).then(({ payload, errors }) => {
      if (errors) setErrorMessages(errors);
      else setRecordTypes(payload as IRecordType[]);
    });
  }, []);

  return (
    <div>
      <h2 className="mb-4 text-center">Results</h2>

      <ErrorMessages errorMessages={errorMessages} />

      <p className="px-3">
        Total submitted results:&nbsp;<b>{results.length === 100 ? '100+' : results.length}</b>
        &#8194;|&#8194;Unapproved:&nbsp;
        <b>{results.filter((r) => r.unapproved).length}</b>
      </p>

      <div className="my-5 table-responsive">
        <table className="table table-hover text-nowrap">
          <thead>
            <tr>
              <th scope="col">Event</th>
              <th scope="col">Competitors</th>
              <th scope="col">Best</th>
              <th scope="col">Average</th>
              <th scope="col">Attempts</th>
              <th scope="col">Date</th>
              <th scope="col">Approved</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {results &&
              recordTypes &&
              results.map((result: IFeResult) => (
                <tr key={(result as any)._id}>
                  <td>{result.event ? shortenEventName(result.event.name) : 'EVENT NOT FOUND'}</td>
                  <td>
                    {result.persons.length > 0 ? (
                      <Competitors persons={result.persons} vertical />
                    ) : (
                      'COMPETITOR NOT FOUND'
                    )}
                  </td>
                  <td>
                    <Time result={result} event={result.event} recordTypes={recordTypes} />
                  </td>
                  <td>
                    {result.attempts.length >= 3 && (
                      <Time result={result} event={result.event} recordTypes={recordTypes} average />
                    )}
                  </td>
                  <td>
                    <Solves event={result.event} attempts={result.attempts} />
                  </td>
                  <td>{getFormattedDate(result.date)}</td>
                  <td>
                    {result.unapproved ? (
                      <span className="badge bg-danger">No</span>
                    ) : (
                      <span className="badge bg-success">Yes</span>
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/admin/results/${(result as any)._id}`}
                      prefetch={false}
                      className="btn btn-primary btn-sm"
                      style={{ padding: C.smallButtonPadding }}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <p>Only showing the first 100 results.</p>
      </div>
    </div>
  );
};

export default ManageResultsPage;
