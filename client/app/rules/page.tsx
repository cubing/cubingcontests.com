'use client';

import { useEffect, useState } from 'react';
import myFetch from '~/helpers/myFetch';
import { IFeEvent } from '@sh/types';
import { INavigationItem } from '~/helpers/interfaces/NavigationItem';
import Tabs from '@c/UI/Tabs';
import ErrorMessages from '@c/UI/ErrorMessages';
import MarkdownDescription from '@c/MarkdownDescription';

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

      {activeTab === 'general' && (
        <>
          <ol className="lh-lg">
            <li>
              The <a href="https://www.worldcubeassociation.org/regulations/full/">WCA Regulations</a> must be followed
              wherever possible.
            </li>
            <li>
              Judges and equipment (i.e. timers, stopwatches, sight blockers, etc.) are required for unofficial events
              at WCA competitions and for unofficial competitions.
            </li>
            <li>Gen 2 timers are allowed in addition to the timers allowed for WCA competitions.</li>
            <li>
              <a href="https://experiments.cubing.net/cubing.js/mark3/">cubing.js</a> or{' '}
              <a href="https://cstimer.net/">csTimer</a> scrambles must be used for twisty puzzle events. In particular,
              random-state scrambles must be used for a puzzle, if available.
            </li>
            <li>Only organizers and Delegates of WCA competitions are allowed to hold unofficial events at them.</li>
          </ol>

          <h4 className="my-4">Relay events</h4>
          <ul className="list-inline ps-3 lh-lg">
            <li>R1. The judge uncovers all puzzles at once.</li>
            <li>
              R2. An attempt includes a normal 15-second inspection phase, regardless of the number of puzzles. The
              competitor(s) is free to inspect any of the puzzles in any order during this phase.
            </li>
          </ul>

          <h4 className="my-4">Team events</h4>
          <ul className="list-inline ps-3 lh-lg">
            <li>T1. There must be no physical contact between any members of a team during an attempt.</li>
            <li>T2. All members of a team may communicate with each other and with the judge.</li>
          </ul>

          {/* 
          <h4 className="my-4">Fully blindfolded events</h4>
          <p>
            A fully blindfolded phase proceeds like a normal blindfolded solve (see{' '}
            <a href="https://www.worldcubeassociation.org/regulations/#article-B-blindfolded">
              Article B of the WCA Regulations
            </a>
            ), with the following changes:
          </p>
          <ul className="list-inline ps-3 lh-lg">
            <li>F1. The competitor must be blindfolded before starting the attempt.</li>
            <li>
              F2. The puzzle must be placed (or remain placed) on the mat uncovered after the competitor is blindfolded
              but before the start of the attempt.
            </li>
            <li>
              F3. The competitor begins the fully blindfolded timing phase by starting a Stackmat timer (similar to B1).
            </li>
            <li>
              F4. The judge should place the sight blocker in front of the competitor before the timer starts. While
              this is the responsibility of the judge, the competitor is encouraged to signal or briefly communicate
              with the judge to ensure the sight blocker is placed ahead of time (e.g. saying "I'm about to start the
              timer" out loud during a 3x3x3 Speed-Blind attempt shortly before donning the blindfold).
            </li>
            <li>
              F5. The memorization phase (B2) is not included. Starting the timer immediately starts the blindfolded
              phase (B3).
            </li>
          </ul>
          */}
        </>
      )}
      {activeTab === 'unofficial' && (
        <>
          <p>
            These rules only apply to unofficial competitions, and they supplement the general rules, with some points
            being overridden.
          </p>
          <ul className="list-inline ps-3 lh-lg">
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
            These rules only apply to meetups, and they supplement the general rules, with some points being overridden.
          </p>
          <ul className="list-inline ps-3 lh-lg">
            <li>
              M1. Timers, stopwatches and other official equipment is not required. Mobile devices may be used to time
              attempts.
            </li>
            <li className="ps-3">M1.1. Inspection time must still be followed.</li>
            <li>M2. Judges are not required.</li>
            <li>
              M3. A meetup may not have fewer than three competitors in total. Such meetups will be removed without the
              results being published.
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
              <h4 className="my-3">{event.name}</h4>
              <MarkdownDescription>{event.ruleText}</MarkdownDescription>
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
  );
};

export default RulesPage;
