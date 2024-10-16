'use client';

import { useEffect, useRef, useState } from 'react';
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
import { useVirtualizer } from '@tanstack/react-virtual';

const ManageResults = ({ recordTypes }: { recordTypes: IRecordType[] }) => {
  const myFetch = useMyFetch();
  const parentRef = useRef();

  const [results, setResults] = useState<IFeResult[]>([]);

  const rowVirtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 43.4167, // UPDATE THIS IF THE TR HEIGHT IN PIXELS EVER CHANGES!
    overscan: 20,
  });

  useEffect(() => {
    myFetch.get('/results/submission-based', { authorize: true }).then(({ payload, errors }) => {
      if (!errors) setResults(payload);
    });
  }, []);

  return (
    <section>
      <h2 className="mb-4 text-center">Results</h2>
      <ToastMessages />

      <p className="px-3">
        Total submitted results:&nbsp;<b>{results.length}</b>
        &#8194;|&#8194;Unapproved:&nbsp;
        <b>{results.filter((r) => r.unapproved).length}</b>
      </p>

      <div ref={parentRef} className="mt-3 table-responsive overflow-y-auto" style={{ height: '600px' }}>
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
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
              {rowVirtualizer.getVirtualItems().map((virtualItem, index) => {
                if (results?.length === 0) return;
                const result = results[virtualItem.index];

                return (
                  <tr
                    key={virtualItem.key as React.Key}
                    style={{
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start - index * virtualItem.size}px)`,
                    }}
                  >
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ManageResults;
