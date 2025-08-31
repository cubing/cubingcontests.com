"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import debounce from "lodash/debounce";
import Form from "~/app/components/form/Form.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import FormDateInput from "~/app/components/form/FormDateInput.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Button from "~/app/components/UI/Button.tsx";
import CreatorDetails from "~/app/components/CreatorDetails.tsx";
import { type RoundFormatObject, roundFormats } from "~/helpers/roundFormats.ts";
import { C } from "~/helpers/constants.ts";
import { getBlankCompetitors, getRoundFormatOptions } from "~/helpers/utilityFunctions.ts";
import { Creator, type InputPerson, RoundFormat } from "~/helpers/types.ts";
import { MainContext } from "~/helpers/contexts.ts";
import FormEventSelect from "~/app/components/form/FormEventSelect.tsx";
import FormSelect from "~/app/components/form/FormSelect.tsx";
import FormPersonInputs from "~/app/components/form/FormPersonInputs.tsx";
import AttemptInput from "~/app/components/AttemptInput.tsx";
import BestAndAverage from "~/app/components/adminAndModerator/BestAndAverage.tsx";
// import Rules from "./video-based-results-rules.mdx";
import type { EventResponse } from "~/server/db/schema/events.ts";
import type { Attempt, SelectResult } from "~/server/db/schema/results.ts";
import { authClient } from "~/helpers/authClient.ts";
import type { PersonResponse } from "~/server/db/schema/persons.ts";
import { RecordConfigResponse } from "~/server/db/schema/record-configs.ts";

const allowedRoundFormats: RoundFormatObject[] = roundFormats.filter((rf) => rf.value !== "3");

type Props = {
  events: EventResponse[];
  // recordPairsByEvent: IEventRecordPairs[];
  activeRecordConfigs: RecordConfigResponse[];
  result?: SelectResult; // only defined when editing an existing result
  competitors?: PersonResponse[];
  creator?: Creator;
  creatorPerson?: PersonResponse;
};

function ResultsSubmissionForm(
  { events, activeRecordConfigs, result, competitors: initCompetitors, creator, creatorPerson }: Props,
) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { changeErrorMessages, changeSuccessMessage } = useContext(MainContext);
  const { data: session } = authClient.useSession();

  const [showRules, setShowRules] = useState(false);
  const [event, setEvent] = useState<EventResponse | undefined>(
    events.find((e) => e.eventId === (result?.eventId ?? searchParams.get("eventId"))) ?? events[0],
  );
  const [roundFormat, setRoundFormat] = useState<RoundFormatObject>(
    result ? allowedRoundFormats.find((rf) => rf.attempts === result.attempts.length)! : allowedRoundFormats[0],
  );
  const [competitors, setCompetitors] = useState<InputPerson[]>(initCompetitors ?? [null]);
  const [personNames, setPersonNames] = useState(initCompetitors?.map((p) => p.name) ?? [""]);
  const [keepCompetitors, setKeepCompetitors] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>(result?.attempts ?? []);
  // null means the date is invalid; undefined means it's empty
  const [date, setDate] = useState<Date | null | undefined>(result ? new Date(result.date) : undefined);
  const [videoLink, setVideoLink] = useState(result?.videoLink ?? "");
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [discussionLink, setDiscussionLink] = useState(result?.discussionLink ?? "");

  // const recordPairs = useMemo<IRecordPair[] | undefined>(
  //   () => recordPairsByEvent.find((erp: IEventRecordPairs) => erp.eventId === event?.eventId)?.recordPairs,
  //   [recordPairsByEvent, event],
  // );

  // const updateRecordPairs = useCallback(
  //   debounce(async (date: Date) => {
  //     const eventsStr = (submissionInfo as IResultsSubmissionInfo).events.map((
  //       e: Event,
  //     ) => e.eventId).join(",");
  //     const queryParams = resultId ? `?excludeResultId=${resultId}` : "";

  //     const res = await myFetch.get(
  //       `/results/record-pairs/${date}/${eventsStr}${queryParams}`,
  //       { authorize: true, loadingId: null },
  //     );

  //     if (res.success) {
  //       setSubmissionInfo(
  //         {
  //           ...submissionInfo,
  //           recordPairsByEvent: res.data,
  //         } as IResultsSubmissionInfo,
  //       );
  //     }
  //     changeLoadingId("");
  //   }, C.fetchDebounceTimeout),
  //   [submissionInfo],
  // );

  const isAdmin = session?.user.role === "admin";

  useEffect(() => {
    if (!result) {
      resetCompetitors((events.find((e) => e.eventId === searchParams.get("eventId")) ?? events[0]).participants);
      resetAttempts();
    }
  }, []);

  const submitResult = async (approve = false) => {
    if (competitors.some((p: InputPerson) => !p)) {
      changeErrorMessages(["Invalid person(s)"]);
      return;
    }

    // const newResult: ICreateVideoBasedResultDto = {
    //   eventId: event.eventId,
    //   date: date as Date,
    //   personIds: competitors.map((p: InputPerson) => (p as IPerson).personId),
    //   attempts,
    //   videoLink: videoUnavailable ? "" : videoLink,
    //   discussionLink: discussionLink || undefined,
    // };

    // const loadingId = approve ? "approve_button" : "submit_button";

    // if (!resultId) {
    //   const res = await myFetch.post("/results", newResult, { loadingId });

    //   if (res.success) {
    //     changeSuccessMessage("Result successfully submitted");
    //     setDate(undefined);
    //     setVideoLink("");
    //     setDiscussionLink("");
    //     resetCompetitors();
    //     resetAttempts();
    //     if (!keepCompetitors) document.getElementById("Competitor_1")?.focus();
    //   }
    // } else {
    //   const updateResultDto: IUpdateVideoBasedResultDto = {
    //     date: newResult.date,
    //     personIds: newResult.personIds,
    //     attempts: newResult.attempts,
    //     videoLink: newResult.videoLink,
    //     discussionLink: newResult.discussionLink,
    //   };
    //   if (!approve) {
    //     updateResultDto.unapproved = (submissionInfo as IAdminResultsSubmissionInfo).result.unapproved;
    //   }

    //   const res = await myFetch.patch(
    //     `/results/video-based/${resultId}`,
    //     updateResultDto,
    //     {
    //       loadingId,
    //       keepLoadingOnSuccess: true,
    //     },
    //   );

    //   if (res.success) {
    //     changeSuccessMessage(
    //       approve ? "Result successfully approved" : "Result successfully updated",
    //     );

    //     setTimeout(() => {
    //       window.location.href = "/admin/results";
    //     }, 1000);
    //   }
    // }
  };

  const changeEvent = (newEventId: string) => {
    const newEvent = events.find((e) => e.eventId === newEventId)!;
    setEvent(newEvent);
    resetAttempts();

    if (!keepCompetitors) resetCompetitors(newEvent.participants);
  };

  const resetCompetitors = (participants: number = event!.participants) => {
    const [competitors, personNames] = getBlankCompetitors(participants);
    setCompetitors(competitors);
    setPersonNames(personNames);
  };

  const changeRoundFormat = (newFormat: RoundFormat) => {
    const newRoundFormat = allowedRoundFormats.find((rf) => rf.value === newFormat) as RoundFormatObject;
    setRoundFormat(newRoundFormat);
    resetAttempts(newRoundFormat.attempts);
  };

  const resetAttempts = (numberOfAttempts: number = roundFormat.attempts) => {
    setAttempts(new Array(numberOfAttempts).fill({ result: 0 }));
  };

  const changeAttempt = (index: number, newAttempt: Attempt) => {
    setAttempts(attempts.map((a: Attempt, i: number) => (i !== index ? a : newAttempt)));
  };

  const changeDate = (newDate: Date | null | undefined) => {
    setDate(newDate);

    // if (newDate) {
    //   updateRecordPairs(newDate);
    //   changeLoadingId("RECORD_PAIRS");
    // } else {
    //   updateRecordPairs.cancel();
    //   changeLoadingId("");
    // }
  };

  const changeVideoLink = (newValue: string) => {
    let newVideoLink: string;

    // Remove unnecessary params from youtube links
    if (newValue.includes("youtube.com") && newValue.includes("&")) {
      newVideoLink = newValue.split("&")[0];
    } else if (newValue.includes("youtu.be") && newValue.includes("?")) {
      newVideoLink = newValue.split("?")[0];
    } else {
      newVideoLink = newValue;
    }

    setVideoLink(newVideoLink);
  };

  return (
    <div>
      <h2 className="text-center">{result ? "Edit Result" : "Submit Result"}</h2>

      <div className="mt-3 mx-auto px-3 fs-6" style={{ maxWidth: "900px" }}>
        {result
          ? (
            <p>
              Once you submit the attempt, the backend will remove future records that would have been cancelled by it.
            </p>
          )
          : (
            <>
              <p>
                Here you can submit results for events that allow submissions. You may submit other people's results
                too. New results will be included in the rankings after an admin approves them. A result can only be
                accepted if it has video evidence of the <b>ENTIRE</b>{" "}
                solve (including memorization, if applicable). The video date is used as proof of when the solve was
                done, an earlier date cannot be used. Make sure that you can be identified from the provided video; if
                your channel name is not your real name, please include your full name or WCA ID in the description of
                the video. If you do not have a WCA ID, please contact the admins to have a competitor profile created
                for you. If you have any questions or suggestions, feel free to send an email to {C.contactEmail}.
              </p>
              <div className="alert alert-warning mb-4" role="alert">
                Rule 6 has been added
              </div>
              <button type="button" className="btn btn-success btn-sm" onClick={() => setShowRules(!showRules)}>
                {showRules ? "Hide rules" : "Show rules"}
              </button>
              {showRules && (
                <div className="mt-4 lh-lg">
                  {/* <Rules /> */}
                </div>
              )}
            </>
          )}
      </div>

      <Form hideControls>
        {result && (
          <CreatorDetails
            creator={creator}
            person={creatorPerson}
            createdExternally={result.createdExternally}
          />
        )}
        <FormEventSelect
          events={events}
          eventId={event?.eventId}
          setEventId={(val) => changeEvent(val)}
          disabled={!!result}
        />
        <FormSelect
          title="Format"
          options={getRoundFormatOptions(allowedRoundFormats)}
          selected={roundFormat.value}
          setSelected={(val: RoundFormat) => changeRoundFormat(val)}
          disabled={!!result}
          className="mb-3"
        />
        <FormPersonInputs
          title="Competitor"
          personNames={personNames}
          setPersonNames={setPersonNames}
          persons={competitors}
          setPersons={setCompetitors}
          nextFocusTargetId={event?.format !== "multi" ? "attempt_1" : "attempt_1_solved"}
          redirectToOnAddPerson={pathname}
          addNewPersonMode={isAdmin ? "default" : "disabled"}
        />
        <FormCheckbox title="Don't clear competitors" selected={keepCompetitors} setSelected={setKeepCompetitors} />
        {!event
          ? <AttemptInput attNumber={1} attempt={{ result: 0 }} setAttempt={() => {}} event={events.at(0)!} disabled />
          : attempts.map((attempt: Attempt, i: number) => (
            <AttemptInput
              key={i}
              attNumber={i + 1}
              attempt={attempt}
              setAttempt={(val: Attempt) => changeAttempt(i, val)}
              event={event}
              memoInputForBld
              allowUnknownTime={isAdmin && ["1", "2"].includes(roundFormat.value)}
              nextFocusTargetId={i + 1 === attempts.length ? (result?.approved ? "video_link" : "date") : undefined}
            />
          ))}
        {
          /* {loadingId === "RECORD_PAIRS" ? <Loading small dontCenter /> : (
          <BestAndAverage
            event={event}
            roundFormat={roundFormat.value}
            attempts={attempts}
            recordPairs={recordPairs}
            recordTypes={submissionInfo.activeRecordTypes}
          />
        )} */
        }
        <FormDateInput
          id="date"
          title="Date (dd.mm.yyyy)"
          value={date}
          setValue={changeDate}
          disabled={result?.approved}
          nextFocusTargetId={videoUnavailable ? "discussion_link" : "video_link"}
          className="my-3"
        />
        <FormTextInput
          id="video_link"
          title="Link to video"
          placeholder="E.g: https://youtube.com/watch?v=xyz"
          value={videoLink}
          setValue={changeVideoLink}
          nextFocusTargetId="discussion_link"
          disabled={videoUnavailable}
          className="mb-3"
        />
        {isAdmin && (
          <FormCheckbox
            title={C.videoNoLongerAvailableMsg}
            selected={videoUnavailable}
            setSelected={setVideoUnavailable}
          />
        )}
        {videoLink && <a href={videoLink} target="_blank" className="d-block mb-3">Video link</a>}
        <FormTextInput
          id="discussion_link"
          title="Link to discussion (optional)"
          placeholder="E.g: https://speedsolving.com/threads/xyz"
          value={discussionLink}
          setValue={setDiscussionLink}
          nextFocusTargetId="submit_button"
          className="mb-3"
        />
        {discussionLink && <a href={discussionLink} target="_blank" className="d-block">Discussion link</a>}
        <Button
          id="submit_button"
          onClick={() => submitResult()}
          // loadingId={loadingId}
          className="mt-3"
        >
          Submit
        </Button>
        {result && !result.approved && (
          <Button
            id="approve_button"
            onClick={() => submitResult(true)}
            // loadingId={loadingId}
            className="btn-success mt-3 ms-3"
          >
            Submit and approve
          </Button>
        )}
      </Form>
    </div>
  );
}

export default ResultsSubmissionForm;
