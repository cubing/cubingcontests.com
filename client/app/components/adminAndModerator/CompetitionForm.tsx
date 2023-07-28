'use client';

import './CompetitionForm.css';
import { useEffect, useMemo, useState } from 'react';
import myFetch from '~/helpers/myFetch';
import Form from '../form/Form';
import FormTextInput from '../form/FormTextInput';
import FormCountrySelect from '../form/FormCountrySelect';
import FormEventSelect from '../form/FormEventSelect';
import FormRadio from '../form/FormRadio';
import DatePicker, { registerLocale, setDefaultLocale } from 'react-datepicker';
import enGB from 'date-fns/locale/en-GB';
import 'react-datepicker/dist/react-datepicker.css';
import { ICompetitionEvent, ICompetitionModData, IEvent, IPerson } from '@sh/interfaces';
import { CompetitionType, RoundFormat, RoundProceed, RoundType } from '@sh/enums';
import { selectPerson } from '~/helpers/utilityFunctions';
import { roundFormats } from '~/helpers/roundFormats';
import { MultiChoiceOption } from '~/helpers/interfaces/MultiChoiceOption';
import { roundTypes } from '~/helpers/roundTypes';

registerLocale('en-GB', enGB);
setDefaultLocale('en-GB');

const competitionTypeOptions: MultiChoiceOption[] = [
  {
    label: 'Meetup',
    value: CompetitionType.Meetup,
  },
  {
    label: 'Competition',
    value: CompetitionType.Competition,
    disabled: true,
  },
];

const roundProceedOptions: MultiChoiceOption[] = [
  {
    label: 'Number',
    value: RoundProceed.Number,
  },
  {
    label: 'Percentage',
    value: RoundProceed.Percentage,
  },
];

const CompetitionForm = ({ events, compData }: { events: IEvent[]; compData?: ICompetitionModData }) => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(1);

  const [competitionId, setCompetitionId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState(CompetitionType.Meetup);
  const [city, setCity] = useState('');
  const [countryId, setCountryId] = useState('');
  const [venue, setVenue] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null); // competition-only
  const [organizerNames, setOrganizerNames] = useState<string[]>(['']);
  const [organizers, setOrganizers] = useState<IPerson[]>([null]);
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [competitorLimit, setCompetitorLimit] = useState('');
  const [mainEventId, setMainEventId] = useState('333');
  const [competitionEvents, setCompetitionEvents] = useState<ICompetitionEvent[]>([]);

  // const [competitionId, setCompetitionId] = useState('NewComp2023');
  // const [name, setName] = useState('New Competition 2023');
  // const [type, setType] = useState(CompetitionType.Meetup);
  // const [city, setCity] = useState('Munich');
  // const [countryId, setCountryId] = useState('DE');
  // const [venue, setVenue] = useState('');
  // const [latitude, setLatitude] = useState('23.477');
  // const [longitude, setLongitude] = useState('-14.346');
  // const [startDate, setStartDate] = useState(new Date());
  // const [endDate, setEndDate] = useState(null); // competition-only
  // const [organizerNames, setOrganizerNames] = useState<string[]>(['']);
  // const [organizers, setOrganizers] = useState<IPerson[]>([null]);
  // const [contact, setContact] = useState('');
  // const [description, setDescription] = useState('Description\n\nNew line');
  // const [competitorLimit, setCompetitorLimit] = useState('10');
  // const [mainEventId, setMainEventId] = useState('333');
  // const [competitionEvents, setCompetitionEvents] = useState<ICompetitionEvent[]>([]);

  const remainingEvents = useMemo(
    () => events.filter((event) => !competitionEvents.some((ce) => ce.eventId === event.eventId)),
    [events],
  );

  useEffect(() => {
    if (compData) {
      setCompetitionId(compData.competition.competitionId);
      setName(compData.competition.name);
      setType(compData.competition.type);
      setCity(compData.competition.city);
      setCountryId(compData.competition.countryId);
      if (compData.competition.venue) setVenue(compData.competition.venue);
      if (compData.competition.coordinates) {
        setLatitude(compData.competition.coordinates[0].toString());
        setLongitude(compData.competition.coordinates[1].toString());
      }
      // Convert the dates from string to Date
      setStartDate(new Date(compData.competition.startDate));
      if (compData.competition.endDate) setEndDate(new Date(compData.competition.endDate));
      if (compData.competition.organizers) {
        setOrganizerNames([...compData.competition.organizers.map((el) => el.name), '']);
        setOrganizers(compData.competition.organizers);
      }
      if (compData.competition.contact) setContact(compData.competition.contact);
      if (compData.competition.description) setDescription(compData.competition.description);
      setCompetitorLimit(compData.competition.competitorLimit.toString());
      setMainEventId(compData.competition.mainEventId);
      setCompetitionEvents(compData.competition.events);
    }
  }, [compData]);

  useEffect(() => {
    document.getElementById('competition_id').focus();
  }, []);

  // Scroll to the top of the page when a new error message is shown
  useEffect(() => {
    if (errorMessages.find((el) => el !== '')) window.scrollTo(0, 0);
  }, [errorMessages]);

  useEffect(() => {
    if (organizerNames.length !== 1) {
      document.getElementById(`organizer_${organizerNames.length}`)?.focus();
    }
  }, [organizerNames.length]);

  const handleSubmit = async () => {
    const selectedOrganizers = organizers.filter((el) => el !== null);
    const trimmedLat = latitude.trim();
    const trimmedLong = longitude.trim();
    const newComp = {
      ...compData.competition,
      competitionId,
      name: name.trim(),
      type,
      city: city.trim(),
      countryId,
      venue: venue.trim() || undefined,
      coordinates: trimmedLat && trimmedLong ? [Number(trimmedLat), Number(trimmedLong)] : undefined,
      startDate,
      endDate: endDate || undefined,
      organizers: selectedOrganizers.length > 0 ? selectedOrganizers : undefined,
      contact: contact.trim() || undefined,
      description: description.trim() || undefined,
      competitorLimit: parseInt(competitorLimit),
      mainEventId,
      // Set the competition ID for every round
      events: competitionEvents.map((event) => ({
        eventId: event.eventId,
        rounds: event.rounds.map((round) => ({ ...round, competitionId })),
      })),
    };

    // Check for errors
    const tempErrors: string[] = [];

    if (!newComp.competitorLimit || isNaN(Number(newComp.competitorLimit)))
      tempErrors.push('You must enter a valid competitor limit');
    if (!!trimmedLat !== !!trimmedLong) tempErrors.push('You must enter both the latitude and the longitude');

    if (newComp.events.length === 0) tempErrors.push('You must enter at least one event');
    else if (!competitionEvents.some((el) => el.eventId === mainEventId))
      tempErrors.push('The selected main event is not on the list of events');

    if (type === CompetitionType.Competition) {
      if (!newComp.venue) tempErrors.push('Please enter the venue');
      if (!newComp.coordinates) tempErrors.push('Please enter the coordinates of the venue');
      if (newComp.startDate > newComp.endDate) tempErrors.push('The start date must be before the end date');
      if (!newComp.organizers?.length) tempErrors.push('Please enter at least one organizer');
    }

    if (tempErrors.length > 0) {
      setErrorMessages(tempErrors);
    } else {
      const { errors } = compData
        ? await myFetch.patch(`/competitions/${compData.competition.competitionId}`, newComp) // edit competition
        : await myFetch.post('/competitions', newComp); // create competition

      if (errors) {
        setErrorMessages(errors);
      } else {
        setErrorMessages([]);
        window.location.href = '/admin';
      }
    }
  };

  const changeType = (newType: CompetitionType) => {
    setType(newType);

    if (newType === CompetitionType.Meetup) {
      setEndDate(null);
    } else {
      setEndDate(new Date());
    }
  };

  const changeOrganizerName = (index: number, value: string) => {
    const newOrganizerNames = organizerNames.map((el, i) => (i !== index ? el : value));
    // Reset the person object for that organizer
    const newOrganizers = organizers.map((el, i) => (i !== index ? el : null));

    // Add new empty input if there isn't an empty one left
    if (!newOrganizers.some((el) => el === null)) {
      newOrganizerNames.push('');
      newOrganizers.push(null);
    }

    setOrganizerNames(newOrganizerNames);
    setOrganizers(newOrganizers);
  };

  const onSelectOrganizer = (index: number, e: any) => {
    selectPerson(e, setErrorMessages, (person: IPerson) => {
      // Set the found organizer's name
      const newOrganizerNames = organizerNames.map((el, i) => (i !== index ? el : person.name));

      if (organizers.some((el) => el?.personId === person.personId)) {
        setErrorMessages(['That organizer has already been selected']);
      } else {
        const newOrganizers = organizers.map((el, i) => (i !== index ? el : person));

        // Add new empty input if there isn't an empty one left
        if (!newOrganizers.some((el) => el === null)) {
          newOrganizerNames.push('');
          newOrganizers.push(null);
        }

        setOrganizers(newOrganizers);
        setErrorMessages([]);
      }

      setOrganizerNames(newOrganizerNames);
    });
  };

  const changeEvent = (index: number, value: string) => {
    const newCompetitionEvents = competitionEvents.map((el, i) => (i !== index ? el : { ...el, eventId: value }));
    setCompetitionEvents(newCompetitionEvents);
  };

  const changeRoundFormat = (eventIndex: number, roundIndex: number, value: RoundFormat) => {
    const newCompetitionEvents = competitionEvents.map((event, i) =>
      i !== eventIndex
        ? event
        : {
            ...event,
            rounds: event.rounds.map((round, i) => (i !== roundIndex ? round : { ...round, format: value })),
          },
    );
    setCompetitionEvents(newCompetitionEvents);
  };

  const changeRoundProceed = (eventIndex: number, roundIndex: number, type: RoundProceed, value?: string) => {
    const newCompetitionEvents = competitionEvents.map((event, i) =>
      i !== eventIndex
        ? event
        : {
            ...event,
            rounds: event.rounds.map((round, i) =>
              i !== roundIndex ? round : { ...round, proceed: { type, value: Number(value) } },
            ),
          },
    );
    setCompetitionEvents(newCompetitionEvents);
  };

  const addRound = (eventIndex: number) => {
    const newCompetitionEvents = competitionEvents.map((event, i) =>
      i !== eventIndex
        ? event
        : {
            ...event,
            rounds: [
              ...event.rounds.map((round, i) =>
                round.roundTypeId !== RoundType.Final
                  ? round
                  : {
                      ...round,
                      proceed: {
                        type: RoundProceed.Percentage,
                        value: 50,
                      },
                      roundTypeId: (Object.values(roundTypes)[i] as any).id,
                    },
              ),
              {
                competitionId: 'temp',
                eventId: event.eventId,
                date: startDate,
                roundTypeId: RoundType.Final,
                format: events.find((el) => el.eventId === event.eventId).defaultRoundFormat,
                results: [],
              },
            ],
          },
    );

    setCompetitionEvents(newCompetitionEvents);
  };

  const addCompetitionEvent = () => {
    setCompetitionEvents([
      ...competitionEvents,
      {
        eventId: events.find((event) => !competitionEvents.some((ce) => ce.eventId === event.eventId))?.eventId,
        rounds: [
          {
            competitionId: 'temp',
            eventId: '333',
            date: startDate,
            roundTypeId: RoundType.Final,
            format: RoundFormat.Average,
            results: [],
          },
        ],
      },
    ]);
  };

  const removeCompetitionEvent = (eventId: string) => {
    setCompetitionEvents(competitionEvents.filter((el) => el.eventId !== eventId));
  };

  return (
    <Form buttonText={compData ? 'Edit' : 'Create'} errorMessages={errorMessages} handleSubmit={handleSubmit}>
      <ul className="mb-3 nav nav-tabs">
        <li className="me-2 nav-item">
          <button
            type="button"
            className={'nav-link' + (activeTab === 1 ? ' active' : '')}
            onClick={() => setActiveTab(1)}
          >
            Details
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={'nav-link' + (activeTab === 2 ? ' active' : '')}
            onClick={() => setActiveTab(2)}
          >
            Events
          </button>
        </li>
      </ul>

      {activeTab === 1 && (
        <>
          <FormTextInput
            name="Competition ID"
            id="competition_id"
            value={competitionId}
            setValue={setCompetitionId}
            disabled={!!compData}
            required
          />
          <FormTextInput name="Competition Name" value={name} setValue={setName} required />
          <FormRadio
            title="Type"
            options={competitionTypeOptions}
            selected={type}
            setSelected={(val: any) => changeType(val)}
            disabled={!!compData}
          />
          <div className="row">
            <div className="col">
              <FormTextInput name="City" value={city} setValue={setCity} required />
            </div>
            <div className="col">
              <FormCountrySelect countryId={countryId} setCountryId={setCountryId} disabled={!!compData} />
            </div>
          </div>
          <div className="row">
            <div className="col-6">
              <FormTextInput
                name="Venue"
                value={venue}
                setValue={setVenue}
                required={type === CompetitionType.Competition}
              />
            </div>
            <div className="col-3">
              <FormTextInput
                name="Latitude"
                value={latitude}
                setValue={setLatitude}
                required={type === CompetitionType.Competition}
              />
            </div>
            <div className="col-3">
              <FormTextInput
                name="Longitude"
                value={longitude}
                setValue={setLongitude}
                required={type === CompetitionType.Competition}
              />
            </div>
          </div>
          <div className="mb-3 row">
            <div className="col">
              <label htmlFor="start_date" className="form-label">
                Start Date
              </label>
              <DatePicker
                id="start_date"
                selected={startDate}
                showTimeSelect={type === CompetitionType.Meetup}
                locale="en-GB"
                timeFormat="p"
                dateFormat={type === CompetitionType.Meetup ? 'Pp' : 'P'}
                onChange={(date: Date) => setStartDate(date)}
                className="form-control"
              />
            </div>
            {type === CompetitionType.Competition && (
              <div className="col">
                <label htmlFor="end_date" className="form-label">
                  End Date
                </label>
                <DatePicker
                  id="end_date"
                  selected={endDate}
                  locale="en-GB"
                  dateFormat="P"
                  onChange={(date: Date) => setEndDate(date)}
                  className="form-control"
                />
              </div>
            )}
          </div>
          <h5>Organizers</h5>
          <div className="my-3 pt-3 px-4 border rounded bg-body-tertiary">
            {organizerNames.map((organizerName, i) => (
              <FormTextInput
                key={i}
                name={`Organizer ${i + 1}`}
                id={`organizer_${i + 1}`}
                value={organizerName}
                setValue={(val: string) => changeOrganizerName(i, val)}
                onKeyPress={(e: any) => onSelectOrganizer(i, e)}
              />
            ))}
          </div>
          <FormTextInput
            name="Contact"
            placeholder="john@example.com"
            value={contact}
            setValue={setContact}
            required={type === CompetitionType.Competition}
          />
          <div className="mb-3">
            <label htmlFor="description" className="form-label">
              Description (optional)
            </label>
            <textarea
              id="description"
              rows={10}
              value={description}
              onChange={(e: any) => setDescription(e.target.value)}
              className="form-control"
            />
          </div>
          <FormTextInput name="Competitor limit" value={competitorLimit} setValue={setCompetitorLimit} required />
        </>
      )}
      {activeTab === 2 && (
        <>
          {competitionEvents.map((compEvent, eventIndex) => (
            <div key={compEvent.eventId} className="mb-3 py-3 px-4 border rounded bg-body-tertiary">
              <FormEventSelect
                label=""
                events={remainingEvents}
                eventId={compEvent.eventId}
                setEventId={(val: string) => changeEvent(eventIndex, val)}
              />
              {compEvent.rounds.map((round, roundIndex) => (
                <div key={round.roundTypeId} className="mb-3 pt-2 px-4 border rounded bg-body-secondary">
                  <div className="mb-3 row">
                    <div className="col-4">
                      <h5 className="mt-2">{roundTypes[round.roundTypeId].label}</h5>
                    </div>
                    <div className="col-8">
                      <div className="fs-5">
                        <label htmlFor="round_format" className="form-label">
                          Round Format
                        </label>
                        <select
                          id="round_format"
                          className="form-select"
                          value={round.format}
                          onChange={(e) => changeRoundFormat(eventIndex, roundIndex, e.target.value as RoundFormat)}
                        >
                          {Object.values(roundFormats).map((rf: any) => (
                            <option key={rf.id} value={rf.id}>
                              {rf.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  {round.roundTypeId !== RoundType.Final && (
                    <>
                      <FormRadio
                        title="Proceed to next round"
                        options={roundProceedOptions}
                        selected={round.proceed.type}
                        setSelected={(val: any) => changeRoundProceed(eventIndex, roundIndex, val as RoundProceed)}
                      />
                      <FormTextInput
                        id="round_proceed_value"
                        value={round.proceed.value.toString()}
                        setValue={(val: string) => changeRoundProceed(eventIndex, roundIndex, round.proceed.type, val)}
                        required
                      />
                    </>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-success" onClick={() => addRound(eventIndex)}>
                Add Round
              </button>
              <button
                type="button"
                className="ms-3 btn btn-danger"
                onClick={() => removeCompetitionEvent(compEvent.eventId)}
              >
                Remove Event
              </button>
            </div>
          ))}
          <button
            type="button"
            className="mt-2 mb-4 btn btn-success"
            onClick={addCompetitionEvent}
            disabled={competitionEvents.length === events.length}
          >
            Add Event
          </button>
          <FormEventSelect label="Main Event" events={events} eventId={mainEventId} setEventId={setMainEventId} />
        </>
      )}
    </Form>
  );
};

export default CompetitionForm;
