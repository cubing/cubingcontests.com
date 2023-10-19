'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import myFetch from '~/helpers/myFetch';
import ResultForm from '@c/adminAndModerator/ResultForm';
import Loading from '@c/Loading';
import Form from '@c/form/Form';
import FormCheckbox from '@c/form/FormCheckbox';
import FormDateInput from '@c/form/FormDateInput';
import FormTextInput from '@c/form/FormTextInput';
import Button from '@c/Button';
import { IAttempt, IEvent, IPerson, IResult, IResultsSubmissionInfo } from '@sh/interfaces';
import { RoundFormat } from '@sh/enums';
import { checkErrorsBeforeResultSubmission, getUserInfo, limitRequests } from '~/helpers/utilityFunctions';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';
import { roundFormats } from '~/shared_helpers/roundFormats';

const userInfo: IUserInfo = getUserInfo();

/**
 * If resultId is defined, that means this component is for submitting new results.
 * Otherwise it's for editing an existing result (admin-only feature).
 */

const ResultsSubmissionForm = ({ resultId }: { resultId?: string }) => {
  if (resultId && !userInfo.isAdmin) throw new Error('Only an admin can edit results');

  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [resultsSubmissionInfo, setResultsSubmissionInfo] = useState<IResultsSubmissionInfo>();
  // Only trigger reset on page load on the submit results page
  const [resultFormResetTrigger, setResultFormResetTrigger] = useState<boolean>(resultId ? undefined : true);
  const [fetchRecordPairsTimer, setFetchRecordPairsTimer] = useState<NodeJS.Timeout>(null);
  const [loadingDuringSubmit, setLoadingDuringSubmit] = useState(false);

  const [event, setEvent] = useState<IEvent>();
  const [roundFormat, setRoundFormat] = useState(RoundFormat.BestOf1);
  const [attempts, setAttempts] = useState<IAttempt[]>([]);
  // null means the date is invalid; undefined means it's empty
  const [date, setDate] = useState<Date | null | undefined>();
  const [competitors, setCompetitors] = useState<IPerson[]>([null]);
  const [videoLink, setVideoLink] = useState('');
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [discussionLink, setDiscussionLink] = useState('');

  const searchParams = useSearchParams();

  const recordPairs = useMemo(
    () => resultsSubmissionInfo?.recordPairsByEvent.find((el) => el.eventId === event.eventId)?.recordPairs,
    [resultsSubmissionInfo, event],
  );

  useEffect(() => {
    // If submitting results
    if (!resultId) {
      myFetch
        .get(`/results/submission-info/${new Date()}`, { authorize: true })
        .then(({ payload, errors }: { payload?: IResultsSubmissionInfo; errors?: string[] }) => {
          if (errors) {
            setErrorMessages(errors);
          } else {
            setResultsSubmissionInfo(payload);

            const event = payload.events.find((el: IEvent) => el.eventId === searchParams.get('eventId'));
            if (event) setEvent(event);
            else setEvent(payload.events[0]);
          }
        });
    }
    // If editing a result
    else {
      myFetch.get(`/results/editing-info/${resultId}`, { authorize: true }).then(({ payload, errors }) => {
        if (errors) {
          setErrorMessages(errors);
        } else {
          setResultsSubmissionInfo(payload);
          const { result, persons, events } = payload as IResultsSubmissionInfo;

          setEvent(events[0]);
          setRoundFormat(
            roundFormats.find((rf) => rf.attempts === result.attempts.length && rf.value !== RoundFormat.BestOf3).value,
          );
          setAttempts(result.attempts);
          setDate(new Date(result.date));
          setCompetitors(persons);
          if (result.videoLink) setVideoLink(result.videoLink);
          if (result.discussionLink) setDiscussionLink(result.discussionLink);
        }
      });
    }
  }, []);

  // Scroll to the top of the page when a new error message is shown
  useEffect(() => {
    if (successMessage || errorMessages.length > 0) window.scrollTo(0, 0);
  }, [errorMessages, successMessage]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const submitResult = async (approve = false) => {
    const newResult: IResult = {
      eventId: event.eventId,
      date,
      personIds: competitors.map((el) => el?.personId || null),
      attempts,
      best: -1,
      average: -1,
      videoLink: videoUnavailable ? undefined : videoLink,
      discussionLink: discussionLink || undefined,
    };

    if (resultsSubmissionInfo.result?.unapproved && !approve) newResult.unapproved = true;

    checkErrorsBeforeResultSubmission(
      newResult,
      event,
      competitors,
      setErrorMessages,
      setSuccessMessage,
      async (newResultWithBestAndAverage) => {
        setLoadingDuringSubmit(true);

        if (!resultId) {
          const { errors } = await myFetch.post('/results', newResultWithBestAndAverage);

          setLoadingDuringSubmit(false);

          if (errors) {
            setErrorMessages(errors);
          } else {
            setSuccessMessage('Successfully submitted');
            setDate(undefined);
            setVideoLink('');
            setDiscussionLink('');
            setResultFormResetTrigger(!resultFormResetTrigger);
          }
        } else {
          const { errors } = await myFetch.patch(`/results/${resultId}`, newResultWithBestAndAverage);

          if (errors) {
            setErrorMessages(errors);
          } else {
            setSuccessMessage('Successfully updated');
            window.location.href = '/admin/results';
          }
        }
      },
    );
  };

  const changeDate = (newDate: Date) => {
    setErrorMessages([]);
    setSuccessMessage('');
    setDate(newDate);

    // Update the record pairs with the new date
    if (newDate) {
      limitRequests(fetchRecordPairsTimer, setFetchRecordPairsTimer, async () => {
        const eventsStr = resultsSubmissionInfo.events.map((e) => e.eventId).join(',');
        const queryParams = resultId ? `?excludeResultId=${resultId}` : '';

        const { payload, errors } = await myFetch.get(`/results/record-pairs/${newDate}/${eventsStr}${queryParams}`, {
          authorize: true,
        });

        if (errors) setErrorMessages(errors);
        else setResultsSubmissionInfo({ ...resultsSubmissionInfo, recordPairsByEvent: payload });
      });
    }
  };

  const changeVideoLink = (newValue: string) => {
    let newVideoLink: string;

    // Remove unnecessary params from youtube links
    if (newValue.includes('youtube.com') && newValue.includes('&')) {
      newVideoLink = newValue.split('&')[0];
    } else if (newValue.includes('youtu.be') && newValue.includes('?')) {
      newVideoLink = newValue.split('?')[0];
    } else {
      newVideoLink = newValue;
    }

    setVideoLink(newVideoLink);
  };

  if (resultsSubmissionInfo) {
    return (
      <div>
        <h2 className="text-center">{resultId ? 'Edit Result' : 'Submit Result'}</h2>

        <div className="mt-3 mx-auto px-3 fs-6" style={{ maxWidth: '900px' }}>
          {resultId ? (
            <p>
              Once you approve the attempt, the backend will remove future records that would have been cancelled by it.
              If you are editing a result that has already been approved, the backend <b>WILL NOT</b> recalculate any
              records.
            </p>
          ) : (
            <>
              <p>
                Here you can submit results for events that allow submissions. They will be included in the rankings
                after an admin approves them. A result can only be accepted if it has video evidence of the entire solve
                (including memorization, if applicable).
              </p>
              <button type="button" className="btn btn-success btn-sm" onClick={() => setShowRules(!showRules)}>
                {showRules ? 'Hide rules' : 'Show rules'}
              </button>
              {showRules && (
                <div className="mt-4">
                  <p>1. For blindfolded events, it must be visible that your mask is on during the solving phase.</p>
                  <p>
                    2. The final time must be visible at the end of the video with no cuts after the end of the solve.
                    Having the time always visible is preferable.
                  </p>
                  <p>
                    3. For team events, every participant must use a different scramble, be in the same place, not touch
                    the puzzle while waiting for other participants, and be visible on video at the same time (an
                    exception can be made for team events with 5+ participants). Penalty for an early start: +2.
                  </p>
                  <p>4. If you&apos;re submitting a Mean of 3, there must be no cuts between the solves.</p>
                  <p>*. Bonus points if it&apos;s visible that a new scramble was generated and applied.</p>
                </div>
              )}
            </>
          )}
        </div>

        <Form errorMessages={errorMessages} successMessage={successMessage} hideButton>
          <ResultForm
            event={event}
            persons={competitors}
            setPersons={setCompetitors}
            attempts={attempts}
            setAttempts={setAttempts}
            recordPairs={recordPairs}
            loadingRecordPairs={fetchRecordPairsTimer !== null}
            recordTypes={resultsSubmissionInfo.activeRecordTypes}
            nextFocusTargetId="date"
            resetTrigger={resultFormResetTrigger}
            setErrorMessages={setErrorMessages}
            setSuccessMessage={setSuccessMessage}
            forSubmitResultsPage
            setEvent={setEvent}
            events={resultsSubmissionInfo.events}
            roundFormat={roundFormat}
            setRoundFormat={setRoundFormat}
            disableMainSelects={!!resultId}
            showOptionToKeepCompetitors
            isAdmin={userInfo.isAdmin}
          />
          <FormDateInput
            id="date"
            title="Date (dd.mm.yyyy)"
            value={date}
            setValue={changeDate}
            nextFocusTargetId={videoUnavailable ? 'discussion_link' : 'video_link'}
          />
          <FormTextInput
            id="video_link"
            title="Link to video"
            placeholder="E.g: https://youtube.com/watch?v=xyz"
            value={videoLink}
            setValue={changeVideoLink}
            nextFocusTargetId="discussion_link"
            disabled={videoUnavailable}
          />
          {userInfo.isAdmin && (
            // Same text as in RankingLinks
            <FormCheckbox
              title="Video no longer available"
              selected={videoUnavailable}
              setSelected={setVideoUnavailable}
            />
          )}
          {resultId && videoLink && (
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
          />
          {resultId && discussionLink && (
            <a href={discussionLink} target="_blank" className="d-block">
              Discussion link
            </a>
          )}
          {resultId && <p className="mt-4">Created by: {resultsSubmissionInfo.createdByUsername}</p>}
          <Button
            id="submit_button"
            text="Submit"
            onClick={() => submitResult()}
            loading={loadingDuringSubmit || fetchRecordPairsTimer !== null}
            className="mt-3"
          />
          {resultId && resultsSubmissionInfo.result.unapproved && (
            <Button
              id="approve_button"
              text="Submit and approve"
              onClick={() => submitResult(true)}
              loading={loadingDuringSubmit || fetchRecordPairsTimer !== null}
              className="btn-success mt-3 ms-3"
            />
          )}
        </Form>
      </div>
    );
  }

  return <Loading errorMessages={errorMessages} />;
};

export default ResultsSubmissionForm;
