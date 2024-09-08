'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil } from '@fortawesome/free-solid-svg-icons';
import { useMyFetch } from '~/helpers/customHooks';
import { IFeResult, IRecordType } from '@sh/types';
import { getFormattedDate, shortenEventName } from '~/helpers/utilityFunctions';
import ToastMessages from '@c/UI/ToastMessages';
import Time from '@c/Time';
import Solves from '@c/Solves';
import Competitors from '@c/Competitors';

const ManageResultsPage = () => {
  const myFetch = useMyFetch();

  const [recordTypes, setRecordTypes] = useState<IRecordType[]>();
  const [results, setResults] = useState<IFeResult[]>([]);

  useEffect(() => {
    myFetch.get('/results/submission-based', { authorize: true }).then(({ payload, errors }) => {
      if (!errors) setResults(payload);
    });

    myFetch.get('/record-types', { authorize: true }).then(({ payload, errors }) => {
      if (!errors) setRecordTypes(payload as IRecordType[]);
    });
  }, []);

  return (
    <div>
      <h2 className="mb-4 text-center">Results</h2>
      <ToastMessages />

      <p className="px-3">
        Total submitted results:&nbsp;<b>{results.length === 100 ? '100+' : results.length}</b>
        &#8194;|&#8194;Unapproved:&nbsp;
        <b>{results.filter((r) => r.unapproved).length}</b>
      </p>

      <div className="mt-3 table-responsive">
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
                      className="btn btn-primary btn-xs"
                      aria-label="Edit"
                    >
                      <FontAwesomeIcon icon={faPencil} />
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 mb-5">Only showing the last 100 results.</p>
    </div>
  );
};

export default ManageResultsPage;
