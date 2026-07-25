"use client";

import { faBrain, faCopy, faEyeSlash, faPencil, faVideo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useContext, useState } from "react";
import EventTitle from "~/app/components/EventTitle.tsx";
import Form from "~/app/components/form/Form.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import FormNumberInput from "~/app/components/form/FormNumberInput.tsx";
import FormRadio from "~/app/components/form/FormRadio.tsx";
import FormSelect from "~/app/components/form/FormSelect.tsx";
import FormTextArea from "~/app/components/form/FormTextArea.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Button from "~/app/components/UI/Button.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import { eventCategories } from "~/helpers/event-categories.ts";
import { eventCategoryOptions, eventFormatOptions } from "~/helpers/multipleChoiceOptions.ts";
import { getRankedAverageFormat, roundFormats } from "~/helpers/roundFormats.ts";
import type { EventFormat, ListPageMode, RoundFormat } from "~/helpers/types.ts";
import { getActionError, getRoundFormatOptions } from "~/helpers/utility-functions.ts";
import type { EventDto } from "~/helpers/validators/Event.ts";
import type { SelectEvent } from "~/server/db/schema/events.ts";
import { createEventSF, updateEventSF } from "~/server/server-functions/event-server-functions.ts";

type Props = {
  events: SelectEvent[];
  videoBasedResultsEnabled: boolean;
};

function ConfigureEventsScreen({ events: initEvents, videoBasedResultsEnabled }: Props) {
  const { slug }: { slug: string } = useParams();
  const { changeErrorMessages, changeSuccessMessage, resetMessages } = useContext(MainContext);

  const { executeAsync: createEvent, isPending: isCreating } = useAction(createEventSF);
  const { executeAsync: updateEvent, isPending: isUpdating } = useAction(updateEventSF);
  const [events, setEvents] = useState(initEvents);
  const [mode, setMode] = useState<ListPageMode>("view");
  const [eventIdUnlocked, setEventIdUnlocked] = useState(false);

  const [eventIdUnderEdit, setEventIdUnderEdit] = useState("");
  const [newEventId, setNewEventId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("miscellaneous");
  const [rank, setRank] = useState<number | undefined>();
  const [format, setFormat] = useState<EventFormat>("time");
  const [defaultRoundFormat, setDefaultRoundFormat] = useState<RoundFormat>("a");
  const [participants, setParticipants] = useState<number | undefined>(1);
  const [submissionsAllowed, setSubmissionsAllowed] = useState(false);
  const [hasMemo, setHasMemo] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [description, setDescription] = useState("");
  const [rule, setRule] = useState("");
  const [importantInfo, setImportantInfo] = useState("");

  const isPending = isCreating || isUpdating;
  const rankedAverageFormat = getRankedAverageFormat(defaultRoundFormat);

  const handleSubmit = async () => {
    if (
      mode !== "edit" ||
      newEventId === eventIdUnderEdit ||
      confirm(`Are you sure you would like to change the event ID from ${eventIdUnderEdit} to ${newEventId}?`)
    ) {
      const newEventDto = {
        eventId: newEventId,
        name,
        category,
        rank: rank as number,
        format,
        defaultRoundFormat,
        participants: participants as number,
        submissionsAllowed,
        hasMemo: format === "number" ? false : hasMemo,
        hidden,
        description: description || null,
        rule: rule || null,
        importantInfo: importantInfo || null,
      } satisfies EventDto;

      const res =
        mode === "add"
          ? await createEvent({ newEventDto })
          : await updateEvent({ newEventDto, originalEventId: eventIdUnderEdit });

      if (res.serverError || res.validationErrors) {
        changeErrorMessages([getActionError(res)]);
      } else {
        changeSuccessMessage(`Event successfully ${mode === "add" ? "created" : "updated"}`);
        setMode("view");

        const newEvents =
          mode === "add" ? [...events, res.data!] : events.map((e) => (e.eventId === eventIdUnderEdit ? res.data! : e));
        newEvents.sort((a, b) => a.rank - b.rank);
        setEvents(newEvents);
      }
    }
  };

  const onCreateEvent = () => {
    resetMessages();
    setMode("add");
    setEventIdUnlocked(false);

    setEventIdUnderEdit("");
    setNewEventId("");
    setName("");
    setCategory("miscellaneous");
    setRank(events.length > 0 ? Math.max(...events.map((e) => e.rank)) + 10 : 10);
    setFormat("time");
    setDefaultRoundFormat("a");
    setParticipants(1);
    setSubmissionsAllowed(false);
    setHasMemo(false);
    setHidden(false);
    setDescription("");
    setRule("");
    setImportantInfo("");
  };

  const onUpdateEvent = (event: SelectEvent, clone = false) => {
    window.scrollTo(0, 0);
    resetMessages();
    setMode(clone ? "add" : "edit");
    setEventIdUnlocked(false);

    setEventIdUnderEdit(clone ? "" : event.eventId);
    setNewEventId(event.eventId);
    setName(event.name);
    setCategory(event.category);
    setRank(clone ? Math.max(...events.map((e) => e.rank)) + 10 : event.rank);
    setFormat(event.format);
    setDefaultRoundFormat(event.defaultRoundFormat);
    setParticipants(event.participants);
    setSubmissionsAllowed(event.submissionsAllowed);
    setHasMemo(event.hasMemo);
    setHidden(event.hidden);
    setDescription(event.description ?? "");
    setRule(event.rule ?? "");
    setImportantInfo(event.importantInfo ?? "");
  };

  const cancel = () => {
    setMode("view");
    resetMessages();
  };

  return (
    <>
      {mode === "view" ? (
        <Button onClick={onCreateEvent} className="btn-success btn-sm mx-2">
          Create Event
        </Button>
      ) : (
        <Form onSubmit={handleSubmit} hideToasts onCancel={cancel} isLoading={isPending}>
          <FormTextInput
            id="event_name"
            title="Event name"
            value={name}
            setValue={setName}
            nextFocusTargetId="event_id"
            disabled={isPending}
            className="mb-3"
          />
          <div className="row mb-3">
            <div className="col">
              <FormTextInput
                id="event_id"
                title="Event ID"
                value={newEventId}
                setValue={setNewEventId}
                nextFocusTargetId="rank"
                disabled={(mode === "edit" && !eventIdUnlocked) || isPending}
              />
            </div>
            <div className="col">
              <FormNumberInput
                id="rank"
                title="Rank"
                tooltip="Determines the order events are displayed in (e.g. on the records page)"
                value={rank}
                setValue={setRank}
                nextFocusTargetId="default_format"
                disabled={isPending}
                integer
                min={1}
              />
            </div>
          </div>
          {mode === "edit" && (
            <FormCheckbox title="Unlock event ID" selected={eventIdUnlocked} setSelected={setEventIdUnlocked} />
          )}
          <div className="row mb-3">
            <div className="col">
              <FormSelect
                id="default_format"
                title="Default format"
                options={getRoundFormatOptions(roundFormats)}
                selected={defaultRoundFormat}
                setSelected={setDefaultRoundFormat as any}
                disabled={mode === "edit" || isPending}
              />
              <p className="fs-6 mt-2 text-secondary">The ranked average format is {rankedAverageFormat.label}</p>
            </div>
            <div className="col">
              <FormNumberInput
                title="Number of team members"
                value={participants}
                setValue={setParticipants}
                disabled={mode === "edit" || isPending}
                tooltip="Leave this at 1 for non-team events"
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
            disabled={mode === "edit" || isPending}
          />
          <p className="mx-1 mb-1 text-body-secondary">Examples:</p>
          <ul className="text-body-secondary">
            <li>Time (2 decimals): 1:41.38 (&lt; 24 hours; if ≥ 10 minutes, the decimals are truncated)</li>
            <li>Time (3 decimals): 36.195 (&lt; 10 minutes)</li>
            <li>Number: 42</li>
            <li>Multi: 8/10 23:26</li>
          </ul>
          <FormRadio
            title="Event category"
            options={eventCategoryOptions}
            selected={category}
            setSelected={setCategory}
            disabled={isPending}
            className="mb-3"
          />
          <h5 className="mb-3">Options</h5>
          {videoBasedResultsEnabled && (
            <FormCheckbox
              title="Allow video-based results"
              selected={submissionsAllowed}
              setSelected={setSubmissionsAllowed}
              disabled={isPending}
              className="mb-3"
            />
          )}
          {format !== "number" && (
            <FormCheckbox
              title="Has memorization time input"
              selected={hasMemo}
              setSelected={setHasMemo}
              disabled={isPending}
              className="mb-3"
            />
          )}
          <FormCheckbox
            title="Hidden"
            selected={hidden}
            setSelected={setHidden}
            disabled={isPending}
            className="mb-3"
          />
          <FormTextArea
            title="Description (optional)"
            value={description}
            setValue={setDescription}
            rows={4}
            disabled={isPending}
          />
          <FormTextArea
            title="Rules (optional, Markdown supported)"
            value={rule}
            setValue={setRule}
            rows={5}
            disabled={isPending}
          />
          <FormTextArea
            title="Important information (optional)"
            value={importantInfo}
            setValue={setImportantInfo}
            rows={4}
            disabled={isPending}
          />
          <p className="fs-6">
            This will be displayed whenever a user selects this event for a contest to make sure they're familiar with
            this information, and it's also displayed on the data entry page. Include some critical info here to make
            sure organizers know about it when they hold the event.
          </p>
        </Form>
      )}

      <div className="table-responsive my-3">
        <table className="table-hover table text-nowrap">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Name</th>
              <th scope="col">Event ID</th>
              <th scope="col">Rank</th>
              <th scope="col">Format</th>
              <th scope="col">Default round format</th>
              <th scope="col">Participants</th>
              <th scope="col">Category</th>
              <th scope="col">Options</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event: SelectEvent, index: number) => (
              <tr key={event.eventId}>
                <td>{index + 1}</td>
                <td>
                  <EventTitle organizationSlug={slug} fontSize="6" event={event} showIcon linkToRankings noMargin />
                </td>
                <td>{event.eventId}</td>
                <td
                  className={
                    events.some((e) => e.eventId !== event.eventId && e.rank === event.rank)
                      ? "fw-bold text-danger"
                      : ""
                  }
                >
                  {event.rank}
                </td>
                <td>{eventFormatOptions.find((efo) => efo.value === event.format)?.label}</td>
                <td>{roundFormats.find((rf) => rf.value === event.defaultRoundFormat)?.shortLabel}</td>
                <td>
                  <span className={`${event.participants > 1 ? "fw-bold text-info" : ""}`}>{event.participants}</span>
                </td>
                <td>
                  <span
                    className={`badge ${
                      event.category === "wca"
                        ? "bg-danger"
                        : event.category === "unofficial"
                          ? "bg-warning text-dark"
                          : event.category === "extreme-bld"
                            ? "bg-primary"
                            : event.category === "miscellaneous"
                              ? "bg-light text-dark"
                              : ""
                    }`}
                  >
                    {eventCategories.find((ec) => event.category === ec.value)?.title}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    {/* For some reason FontAwesomeIcon doesn't like having title attributes (causes hydration errors) */}
                    {event.submissionsAllowed && (
                      <span title="Allow video-based results">
                        <FontAwesomeIcon icon={faVideo} />
                      </span>
                    )}
                    {event.hasMemo && (
                      <span title="Has memorization time input">
                        <FontAwesomeIcon icon={faBrain} />
                      </span>
                    )}
                    {event.hidden && (
                      <span title="Hidden">
                        <FontAwesomeIcon icon={faEyeSlash} />
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      onClick={() => onUpdateEvent(event)}
                      disabled={isPending}
                      className="btn-xs"
                      title="Edit"
                      ariaLabel="Edit"
                    >
                      <FontAwesomeIcon icon={faPencil} />
                    </Button>
                    <Button
                      onClick={() => onUpdateEvent(event, true)}
                      disabled={isPending}
                      className="btn-xs"
                      title="Clone"
                      aria-label="Clone"
                    >
                      <FontAwesomeIcon icon={faCopy} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default ConfigureEventsScreen;
