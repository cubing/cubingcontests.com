'use client';

import { useEffect, useState } from 'react';
import myFetch from '~/helpers/myFetch';
import Form from '@c/form/Form';
import FormTextInput from '@c/form/FormTextInput';
import FormSelect from '@c/form/FormSelect';
import FormRadio from '@c/form/FormRadio';
import FormNumberInput from '@c/form/FormNumberInput';
import FormCheckbox from '@c/form/FormCheckbox';
import FormTextArea from '@c/form/FormTextArea';
import { IFrontendEvent } from '@sh/interfaces';
import { EventFormat, EventGroup, RoundFormat } from '@sh/enums';
import { roundFormats } from '@sh/roundFormats';
import { eventCategories } from '~/helpers/eventCategories';
import { eventCategoryOptions, eventFormatOptions, roundFormatOptions } from '~/helpers/multipleChoiceOptions';
import { useScrollToTopForNewMessage } from '~/helpers/clientSideFunctions';

type Mode = 'view' | 'add' | 'edit';

const CreateEditEventPage = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [events, setEvents] = useState<IFrontendEvent[]>([]);
  const [loadingDuringSubmit, setLoadingDuringSubmit] = useState(false);
  const [mode, setMode] = useState<Mode>('view');
  const [eventIdUnlocked, setEventIdUnlocked] = useState(false);

  const [eventId, setEventId] = useState('');
  const [name, setName] = useState('');
  const [newEventId, setNewEventId] = useState('');
  const [rank, setRank] = useState(0);
  const [format, setFormat] = useState(EventFormat.Time);
  const [defaultRoundFormat, setDefaultRoundFormat] = useState(RoundFormat.Average);
  const [participants, setParticipants] = useState(1);
  const [category, setCategory] = useState(EventGroup.Miscellaneous);
  const [submissionsAllowed, setSubmissionsAllowed] = useState(false);
  const [removedWCA, setRemovedWCA] = useState(false);
  const [hasMemo, setHasMemo] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [description, setDescription] = useState('');
  const [rule, setRule] = useState('');

  useEffect(() => {
    myFetch.get('/events/mod', { authorize: true }).then(({ payload, errors }) => {
      if (errors) setErrorMessages(errors);
      else setEvents(payload);
    });
  }, []);

  useEffect(() => {
    if (mode !== 'view') document.getElementById('event_name').focus();
  }, [mode]);

  useScrollToTopForNewMessage({ errorMessages });

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const handleSubmit = async () => {
    if (!participants) {
      setErrorMessages(['Please enter a valid number of participants']);
      return;
    }
    if (!rank) {
      setErrorMessages(['Please enter a valid rank']);
      return;
    }

    setLoadingDuringSubmit(true);
    setErrorMessages([]);

    const newEvent: IFrontendEvent = {
      eventId: newEventId,
      name,
      rank,
      format,
      defaultRoundFormat,
      groups: [category],
      participants: participants > 1 ? participants : undefined,
      description: description || undefined,
      ruleText: rule || undefined,
    };

    if (submissionsAllowed) newEvent.groups.push(EventGroup.SubmissionsAllowed);
    if (removedWCA) newEvent.groups.push(EventGroup.RemovedWCA);
    if (hasMemo) newEvent.groups.push(EventGroup.HasMemo);
    if (hidden) newEvent.groups.push(EventGroup.Hidden);

    const requestFunction = mode === 'add' ? myFetch.post : myFetch.patch;
    const requestURL = mode === 'add' ? '/events' : `/events/${eventId}`;

    const { payload, errors } = await requestFunction(requestURL, newEvent);

    if (errors) {
      setErrorMessages(errors);
    } else {
      reset('view');
      setEvents(payload);
    }

    setLoadingDuringSubmit(false);
  };

  const onAddEvent = () => {
    reset('add');
  };

  const onEditEvent = (event: IFrontendEvent) => {
    reset('edit');

    setEventId(event.eventId);
    setNewEventId(event.eventId);
    setName(event.name);
    setRank(event.rank);
    setFormat(event.format);
    setDefaultRoundFormat(event.defaultRoundFormat);
    setParticipants(event.participants || 1);
    setCategory(event.groups.find((g) => eventCategories.some((ec) => ec.group === g)));
    setSubmissionsAllowed(event.groups.includes(EventGroup.SubmissionsAllowed));
    setRemovedWCA(event.groups.includes(EventGroup.RemovedWCA));
    setHasMemo(event.groups.includes(EventGroup.HasMemo));
    setHidden(event.groups.includes(EventGroup.Hidden));
    setDescription(event.description);
    setRule(event.ruleText);

    window.scrollTo(0, 0);
  };

  const reset = (newMode: Mode) => {
    setErrorMessages([]);
    setEventIdUnlocked(false);
    setMode(newMode);
  };

  return (
    <div>
      <h2 className="mb-4 text-center">Events</h2>

      {mode === 'view' ? (
        <button type="button" className="btn btn-success ms-3" onClick={onAddEvent}>
          Add event
        </button>
      ) : (
        <Form
          buttonText="Submit"
          errorMessages={errorMessages}
          onSubmit={handleSubmit}
          showCancelButton
          onCancel={() => reset('view')}
          disableButton={loadingDuringSubmit}
        >
          <FormTextInput
            id="event_name"
            title="Event name"
            value={name}
            setValue={setName}
            nextFocusTargetId="event_id"
            disabled={loadingDuringSubmit}
          />
          <div className="row">
            <div className="col">
              <FormTextInput
                id="event_id"
                title="Event ID"
                value={newEventId}
                setValue={setNewEventId}
                nextFocusTargetId="rank"
                disabled={(mode === 'edit' && !eventIdUnlocked) || loadingDuringSubmit}
              />
            </div>
            <div className="col">
              <FormNumberInput
                id="rank"
                title="Rank"
                tooltip="Determines the order of the events"
                value={rank}
                setValue={setRank}
                nextFocusTargetId="default_format"
                disabled={loadingDuringSubmit}
                integer
                min={1}
              />
            </div>
          </div>
          {mode === 'edit' && (
            <FormCheckbox title="Unlock event ID" selected={eventIdUnlocked} setSelected={setEventIdUnlocked} />
          )}
          <div className="row">
            <div className="col">
              <FormSelect
                id="default_format"
                title="Default format"
                options={roundFormatOptions}
                selected={defaultRoundFormat}
                setSelected={setDefaultRoundFormat}
                disabled={mode === 'edit' || loadingDuringSubmit}
              />
            </div>
            <div className="col">
              <FormNumberInput
                title="Participants"
                value={participants}
                setValue={setParticipants}
                disabled={mode === 'edit' || loadingDuringSubmit}
                integer
                min={1}
              />
            </div>
          </div>
          <FormRadio
            title="Event format"
            options={eventFormatOptions}
            selected={format}
            setSelected={setFormat}
            disabled={mode === 'edit' || loadingDuringSubmit}
          />
          <div className="mb-4">
            <FormRadio
              title="Event category"
              options={eventCategoryOptions}
              selected={category}
              setSelected={setCategory}
              disabled={loadingDuringSubmit}
            />
          </div>
          <h5 className="mb-4">Options</h5>
          <FormCheckbox
            title="Allow submissions"
            selected={submissionsAllowed}
            setSelected={setSubmissionsAllowed}
            disabled={loadingDuringSubmit}
          />
          <FormCheckbox
            title="Formerly WCA event"
            selected={removedWCA}
            setSelected={setRemovedWCA}
            disabled={loadingDuringSubmit}
          />
          <FormCheckbox
            title="Has memorization"
            selected={hasMemo}
            setSelected={setHasMemo}
            disabled={loadingDuringSubmit}
          />
          <FormCheckbox title="Hidden" selected={hidden} setSelected={setHidden} disabled={loadingDuringSubmit} />
          <FormTextArea
            title="Description (optional)"
            value={description}
            setValue={setDescription}
            rows={4}
            disabled={loadingDuringSubmit}
          />
          <FormTextArea
            title="Rules (optional)"
            value={rule}
            setValue={setRule}
            rows={5}
            disabled={loadingDuringSubmit}
          />
        </Form>
      )}

      <div className="container my-5 table-responsive">
        <table className="table table-hover text-nowrap">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Name</th>
              <th scope="col">Event ID</th>
              <th scope="col">Rank</th>
              <th scope="col">Default format</th>
              <th scope="col">Category</th>
              {/* <th scope="col">Groups</th> */}
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event: IFrontendEvent, index) => (
              <tr key={event.eventId}>
                <td>{index + 1}</td>
                <td>{event.name}</td>
                <td>{event.eventId}</td>
                <td>{event.rank}</td>
                <td>{roundFormats.find((rf) => rf.value === event.defaultRoundFormat).shortLabel}</td>
                <td>{eventCategories.find((ec) => event.groups.includes(ec.group)).title}</td>
                {/* <td>X</td> */}
                <td>
                  <button type="button" onClick={() => onEditEvent(event)} className="btn btn-primary btn-sm">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CreateEditEventPage;
