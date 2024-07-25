'use client';

import { useEffect, useState } from 'react';
import myFetch from '~/helpers/myFetch';
import { IFeEvent } from '@sh/types';
import { INavigationItem } from '~/helpers/interfaces/NavigationItem';
import Tabs from '@c/UI/Tabs';
import ErrorMessages from '@c/UI/ErrorMessages';
import MarkdownDescription from '@c/MarkdownDescription';
import { roundFormats } from '~/shared_helpers/roundFormats';
import { RoundFormat } from '~/shared_helpers/enums';

const RulesPage = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('general');
  const [events, setEvents] = useState<IFeEvent[]>([]);

  const tabs: INavigationItem[] = [
    { title: 'General', value: 'general' },
    { title: 'Unofficial Competitions', shortTitle: 'Unofficial', value: 'unofficial' },
    { title: 'Meetups', value: 'meetups' },
  ];

  useEffect(() => {
    myFetch.get('/events/with-rules').then(({ payload, errors }) => {
      if (errors) setErrorMessages(errors);
      else setEvents(payload);
    });
  }, []);

  return (
    <div>
      <h2 className="mb-4 text-center">Rules</h2>

      <ErrorMessages errorMessages={errorMessages} />

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />

      <div className="px-2">
        {activeTab === 'general' && (
          <>
            <ol className="ps-3 lh-lg">
              <li>
                The <a href="https://www.worldcubeassociation.org/regulations/full/">WCA Regulations</a> must be
                followed wherever possible.
              </li>
              <li>
                Judges and equipment (i.e. timers, stopwatches, sight blockers, etc.) are required for unofficial events
                at WCA competitions and for unofficial competitions.
              </li>
              <li>Gen 2 timers are allowed in addition to the timers allowed for WCA competitions.</li>
              <li>
                <a href="https://experiments.cubing.net/cubing.js/mark3/">cubing.js</a> or{' '}
                <a href="https://cstimer.net/">csTimer</a> scrambles must be used for twisty puzzle events. In
                particular, random-state scrambles must be used for a puzzle, if available.
              </li>
              <li>Only organizers and Delegates of WCA competitions are allowed to hold unofficial events at them.</li>
              <li>
                Every event has a ranked average format (i.e. Average of 5, Mean of 3). If a round uses a different
                average format, average results from that round will not be included in the rankings (but single results
                will).
              </li>
            </ol>

            <h4 className="my-4">Relay events</h4>
            <ul className="list-inline lh-lg">
              <li>R1. The judge uncovers all puzzles at once.</li>
              <li>
                R2. An attempt includes a normal 15-second inspection phase, regardless of the number of puzzles. The
                competitor(s) is free to inspect any of the puzzles in any order during this phase.
              </li>
            </ul>

            <h4 className="my-4">Team events</h4>
            <ul className="list-inline lh-lg">
              <li>T1. There must be no physical contact between any members of a team during an attempt.</li>
              <li>T2. All members of a team may communicate with each other and with the judge.</li>
              <li>T3. A team must consist of the same members for all attempts across all rounds of an event. Exception: Some events may have specific allowances for this.</li>
              <li>T4. A competitor who has participated in an event as part of one team must not compete as part of any other team for that event.</li>
            </ul>

            <h4 className="my-4">Fully blindfolded events</h4>
            <ul className="list-inline lh-lg">
              <li>
                F1. A fully blindfolded attempt proceeds like a normal blindfolded attempt (see{' '}
                <a href="https://www.worldcubeassociation.org/regulations/#article-B-blindfolded">
                  Article B of the WCA Regulations
                </a>
                ), with the following changes:
              </li>
              <li>F2. There is no memorization phase.</li>
              <li>F3. The competitor must be blindfolded before the start of the attempt.</li>
              <li>
                F4. After the competitor dons the blindfold, the judge holds up the sight blocker between the
                competitor's face and the puzzle, and tells the competitor they may start the attempt.
              </li>
              <li>
                F5. The competitor starts the attempt by starting the timer. This is the same as other events, except
                the competitor starts the timer and lifts the puzzle cover while blindfolded, entirely by feel.
              </li>
            </ul>
          </>
        )}
        {activeTab === 'unofficial' && (
          <>
            <p>
              These rules only apply to unofficial competitions, and they supplement the general rules, with some points
              being overridden.
            </p>
            <ul className="list-inline lh-lg">
              <li>
                U1. An unofficial competition may not have fewer than three competitors in total. Such competitions will
                be removed without the results being published.
              </li>
              <li>U2. An unofficial competition may not be held at a private residence.</li>
            </ul>
          </>
        )}
        {activeTab === 'meetups' && (
          <>
            <p>
              These rules only apply to meetups, and they supplement the general rules, with some points being
              overridden.
            </p>
            <ul className="list-inline lh-lg">
              <li>
                M1. Timers, stopwatches and other official equipment is not required. Mobile devices may be used to time
                attempts.
              </li>
              <li className="ps-3">M1.1. Inspection time must still be followed.</li>
              <li>M2. Judges are not required.</li>
              <li>
                M3. A meetup may not have fewer than three competitors in total. Such meetups will be removed without
                the results being published.
              </li>
              <li>M4. A meetup may not be held at a private residence.</li>
            </ul>
          </>
        )}

        {events.length > 0 && (
          <>
            <hr />
            <h3>Event rules</h3>
            <p>
              These rules apply to each event individually. If an event is not listed here, it must follow the most
              relevant WCA Regulations, based on the nature of the event.
            </p>
            {events.map((event) => (
              <div key={event.eventId}>
                <h4 className="mt-4 mb-3">{event.name}</h4>
                <MarkdownDescription>{event.ruleText}</MarkdownDescription>
                <p>
                  The ranked average format is{' '}
                  <b>
                    {roundFormats.find((rf) => rf.value === event.defaultRoundFormat)?.value === RoundFormat.Average
                      ? roundFormats[4].label
                      : roundFormats[3].label}
                  </b>
                  .
                </p>
              </div>
            ))}
          </>
        )}

        <hr />
        <h3>License</h3>
        <p>
          The contents of this page are available under the{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC Attribution-ShareAlike 4.0 International</a>{' '}
          license.
        </p>
      </div>
    </div>
  );
};

export default RulesPage;
