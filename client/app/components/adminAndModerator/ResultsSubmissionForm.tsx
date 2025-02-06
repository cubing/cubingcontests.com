"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { debounce } from "lodash";
import Markdown from "react-markdown";
import { useMyFetch } from "~/helpers/customHooks.ts";
import Loading from "~/app/components/UI/Loading.tsx";
import Form from "~/app/components/form/Form.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import FormDateInput from "~/app/components/form/FormDateInput.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Button from "~/app/components/UI/Button.tsx";
import CreatorDetails from "~/app/components/CreatorDetails.tsx";
import {
  type Event,
  type IAdminResultsSubmissionInfo,
  type ICreateVideoBasedResultDto,
  type IEventRecordPairs,
  type IFeAttempt,
  type IPerson,
  type IRecordPair,
  type IResultsSubmissionInfo,
  type IRoundFormat,
  type IUpdateVideoBasedResultDto,
} from "~/helpers/types.ts";
import { EventFormat, RoundFormat } from "~/helpers/enums.ts";
import { roundFormats } from "~/helpers/roundFormats.ts";
import { C } from "~/helpers/constants.ts";
import { getBlankCompetitors, getRoundFormatOptions, getUserInfo } from "~/helpers/utilityFunctions.ts";
import { type InputPerson, UserInfo } from "~/helpers/types.ts";
import { MainContext } from "~/helpers/contexts.ts";
import FormEventSelect from "~/app/components/form/FormEventSelect.tsx";
import FormSelect from "~/app/components/form/FormSelect.tsx";
import FormPersonInputs from "~/app/components/form/FormPersonInputs.tsx";
import AttemptInput from "~/app/components/AttemptInput.tsx";
import BestAndAverage from "~/app/components/adminAndModerator/BestAndAverage.tsx";
import rules from "./video-based-results-rules.md";

const userInfo: UserInfo = getUserInfo();
const allowedRoundFormats: IRoundFormat[] = roundFormats.filter((rf) => rf.value !== RoundFormat.BestOf3);

/**
 * If resultId is defined, that means this component is for submitting new results.
 * Otherwise it's for editing an existing result (admin-only feature).
 */
type Props = {
  resultId?: string;
};

const ResultsSubmissionForm = ({ resultId }: Props) => {
  if (resultId && !userInfo?.isAdmin) {
    throw new Error("Only an admin can edit results");
  }

  const searchParams = useSearchParams();
  const myFetch = useMyFetch();
  const {
    changeErrorMessages,
    changeSuccessMessage,
    loadingId,
    changeLoadingId,
  } = useContext(MainContext);

  const [showRules, setShowRules] = useState(false);
  const [submissionInfo, setSubmissionInfo] = useState<
    IResultsSubmissionInfo | IAdminResultsSubmissionInfo
  >();
  // TO-DO: make it so that some of the submission info including the event is prefetched server-side and clean this up
  const [event, setEvent] = useState<Event>({} as Event);
  const [roundFormat, setRoundFormat] = useState<IRoundFormat>(
    allowedRoundFormats[0],
  );
  const [competitors, setCompetitors] = useState<InputPerson[]>([null]);
  const [personNames, setPersonNames] = useState([""]);
  const [keepCompetitors, setKeepCompetitors] = useState(false);
  const [attempts, setAttempts] = useState<IFeAttempt[]>([]);
  const [date, setDate] = useState<Date | null | undefined>(); // null means the date is invalid; undefined means it's empty
  const [videoLink, setVideoLink] = useState("");
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [discussionLink, setDiscussionLink] = useState("");

  const recordPairs = useMemo<IRecordPair[] | undefined>(
    () =>
      submissionInfo?.recordPairsByEvent.find((erp: IEventRecordPairs) => erp.eventId === event?.eventId)?.recordPairs,
    [submissionInfo, event],
  );

  const updateRecordPairs = useCallback(
    debounce(async (date: Date) => {
      const eventsStr = (submissionInfo as IResultsSubmissionInfo).events.map((
        e: Event,
      ) => e.eventId).join(",");
      const queryParams = resultId ? `?excludeResultId=${resultId}` : "";

      const res = await myFetch.get(
        `/results/record-pairs/${date}/${eventsStr}${queryParams}`,
        { authorize: true, loadingId: null },
      );

      if (res.success) {
        setSubmissionInfo(
          {
            ...submissionInfo,
            recordPairsByEvent: res.data,
          } as IResultsSubmissionInfo,
        );
      }
      changeLoadingId("");
    }, C.fetchDebounceTimeout),
    [submissionInfo],
  );

  const isDateDisabled = !!resultId && (submissionInfo as any)?.result &&
    !(submissionInfo as any).result.unapproved;

  useEffect(() => {
    // If submitting results
    if (!resultId) {
      myFetch
        .get<IResultsSubmissionInfo>(`/results/submission-info/${new Date()}`, {
          authorize: true,
        })
        .then(
          (res) => {
            if (res.success && res.data) {
              setSubmissionInfo(res.data);

              const event = res.data.events.find((el: Event) => el.eventId === searchParams.get("eventId")) ??
                res.data.events[0];
              setEvent(event);
              resetCompetitors(event.participants);
              resetAttempts();
              document.getElementById("Competitor_1")?.focus();
            }
          },
        );
    } // If editing a result
    else {
      myFetch.get(`/results/editing-info/${resultId}`, { authorize: true })
        .then((res) => {
          if (res.success && res.data) {
            setSubmissionInfo(res.data);
            const { result, persons, events } = res
              .data as IAdminResultsSubmissionInfo;

            setEvent(events[0]);
            setRoundFormat(
              allowedRoundFormats.find((rf) => rf.attempts === result.attempts.length) as IRoundFormat,
            );
            setAttempts(result.attempts);
            setDate(new Date(result.date));
            setCompetitors(persons);
            setPersonNames(persons.map((p: IPerson) => p.name));
            setVideoLink(result.videoLink);
            if (result.discussionLink) setDiscussionLink(result.discussionLink);
          }
        });
    }
  }, []);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const submitResult = async (approve = false) => {
    if (competitors.some((p: InputPerson) => !p)) {
      changeErrorMessages(["Invalid person(s)"]);
      return;
    }

    const newResult: ICreateVideoBasedResultDto = {
      eventId: event.eventId,
      date: date as Date,
      personIds: competitors.map((p: InputPerson) => (p as IPerson).personId),
      attempts,
      videoLink: videoUnavailable ? "" : videoLink,
      discussionLink: discussionLink || undefined,
    };

    const loadingId = approve ? "approve_button" : "submit_button";

    if (!resultId) {
      const res = await myFetch.post("/results", newResult, { loadingId });

      if (res.success) {
        changeSuccessMessage("Result successfully submitted");
        setDate(undefined);
        setVideoLink("");
        setDiscussionLink("");
        resetCompetitors();
        resetAttempts();
        if (!keepCompetitors) document.getElementById("Competitor_1")?.focus();
      }
    } else {
      const updateResultDto: IUpdateVideoBasedResultDto = {
        date: newResult.date,
        personIds: newResult.personIds,
        attempts: newResult.attempts,
        videoLink: newResult.videoLink,
        discussionLink: newResult.discussionLink,
      };
      if (!approve) {
        updateResultDto.unapproved = (submissionInfo as IAdminResultsSubmissionInfo).result.unapproved;
      }

      const res = await myFetch.patch(
        `/results/video-based/${resultId}`,
        updateResultDto,
        {
          loadingId,
          keepLoadingOnSuccess: true,
        },
      );

      if (res.success) {
        changeSuccessMessage(
          approve ? "Result successfully approved" : "Result successfully updated",
        );

        setTimeout(() => {
          window.location.href = "/admin/results";
        }, 1000);
      }
    }
  };

  const changeEvent = (newEventId: string) => {
    const newEvent = (submissionInfo as IResultsSubmissionInfo).events.find((
      e: Event,
    ) => e.eventId === newEventId) as Event;
    setEvent(newEvent);
    resetAttempts();

    if (!keepCompetitors) resetCompetitors(newEvent.participants);
  };

  const resetCompetitors = (participants: number = event.participants) => {
    const [competitors, personNames] = getBlankCompetitors(participants);
    setCompetitors(competitors);
    setPersonNames(personNames);
  };

  const changeRoundFormat = (newFormat: RoundFormat) => {
    const newRoundFormat = allowedRoundFormats.find((rf) => rf.value === newFormat) as IRoundFormat;
    setRoundFormat(newRoundFormat);
    resetAttempts(newRoundFormat.attempts);
  };

  const resetAttempts = (numberOfAttempts: number = roundFormat.attempts) => {
    setAttempts(new Array(numberOfAttempts).fill({ result: 0 }));
  };

  const changeAttempt = (index: number, newAttempt: IFeAttempt) => {
    setAttempts(
      attempts.map((
        a: IFeAttempt,
        i: number,
      ) => (i !== index ? a : newAttempt)),
    );
  };

  const changeDate = (newDate: Date | null | undefined) => {
    setDate(newDate);

    if (newDate) {
      updateRecordPairs(newDate);
      changeLoadingId("RECORD_PAIRS");
    } else {
      updateRecordPairs.cancel();
      changeLoadingId("");
    }
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

  if (!submissionInfo) return <Loading />;

  return (
    <div>
      <h2 className="text-center">
        {resultId ? "Edit Result" : "Submit Result"}
      </h2>

      <div className="mt-3 mx-auto px-3 fs-6" style={{ maxWidth: "900px" }}>
        {resultId
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
                Rule 2 has been updated!
              </div>
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() => setShowRules(!showRules)}
              >
                {showRules ? "Hide rules" : "Show rules"}
              </button>
              {showRules && <Markdown className="mt-4 lh-lg">{rules}</Markdown>}
            </>
          )}
      </div>

      <Form hideButton>
        {resultId && (
          <CreatorDetails
            creator={(submissionInfo as IAdminResultsSubmissionInfo).creator}
          />
        )}
        <FormEventSelect
          events={submissionInfo.events}
          eventId={event.eventId}
          setEventId={(val) => changeEvent(val)}
          disabled={resultId !== undefined}
        />
        <FormSelect
          title="Format"
          options={getRoundFormatOptions(allowedRoundFormats)}
          selected={roundFormat.value}
          setSelected={(val: RoundFormat) => changeRoundFormat(val)}
          disabled={resultId !== undefined}
          className="mb-3"
        />
        <FormPersonInputs
          title="Competitor"
          personNames={personNames}
          setPersonNames={setPersonNames}
          persons={competitors}
          setPersons={setCompetitors}
          nextFocusTargetId={event.format !== EventFormat.Multi ? "attempt_1" : "attempt_1_solved"}
          redirectToOnAddPerson={window.location.pathname}
        />
        <FormCheckbox
          title="Don't clear competitors"
          selected={keepCompetitors}
          setSelected={setKeepCompetitors}
        />
        {attempts.map((attempt: IFeAttempt, i: number) => (
          <AttemptInput
            key={i}
            attNumber={i + 1}
            attempt={attempt}
            setAttempt={(val: IFeAttempt) => changeAttempt(i, val)}
            event={event}
            memoInputForBld
            allowUnknownTime={userInfo?.isAdmin &&
              [RoundFormat.BestOf1, RoundFormat.BestOf2].includes(
                roundFormat.value,
              )}
            nextFocusTargetId={i + 1 === attempts.length ? isDateDisabled ? "video_link" : "date" : undefined}
          />
        ))}
        {loadingId === "RECORD_PAIRS" ? <Loading small dontCenter /> : (
          <BestAndAverage
            event={event}
            roundFormat={roundFormat.value}
            attempts={attempts}
            recordPairs={recordPairs}
            recordTypes={submissionInfo.activeRecordTypes}
          />
        )}
        <FormDateInput
          id="date"
          title="Date (dd.mm.yyyy)"
          value={date}
          setValue={changeDate}
          disabled={isDateDisabled}
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
        {userInfo?.isAdmin && (
          <FormCheckbox
            title={C.videoNoLongerAvailableMsg}
            selected={videoUnavailable}
            setSelected={setVideoUnavailable}
          />
        )}
        {videoLink && (
          <a href={videoLink} target="_blank" className="d-block mb-3">
            Video link
          </a>
        )}
        <FormTextInput
          id="discussion_link"
          title="Link to discussion (optional)"
          placeholder="E.g: https://speedsolving.com/threads/xyz"
          value={discussionLink}
          setValue={setDiscussionLink}
          nextFocusTargetId="submit_button"
          className="mb-3"
        />
        {discussionLink && (
          <a href={discussionLink} target="_blank" className="d-block">
            Discussion link
          </a>
        )}
        <Button
          id="submit_button"
          onClick={() => submitResult()}
          loadingId={loadingId}
          className="mt-3"
        >
          Submit
        </Button>
        {resultId &&
          (submissionInfo as IAdminResultsSubmissionInfo).result.unapproved && (
          <Button
            id="approve_button"
            onClick={() => submitResult(true)}
            loadingId={loadingId}
            className="btn-success mt-3 ms-3"
          >
            Submit and approve
          </Button>
        )}
      </Form>
    </div>
  );
};

export default ResultsSubmissionForm;
