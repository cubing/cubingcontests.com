'use client';

import { useEffect, useMemo, useState } from 'react';
import myFetch from '~/helpers/myFetch';
import Loading from '@c/Loading';
import Form from '@c/form/Form';
import FormDateInput from '~/app/components/form/FormDateInput';
import FormTextInput from '~/app/components/form/FormTextInput';
import FormCheckbox from '~/app/components/form/FormCheckbox';
import ResultForm from '~/app/components/adminAndModerator/ResultForm';
import Button from '~/app/components/Button';
import { IAttempt, IEvent, IPerson, IResult, IResultsSubmissionInfo } from '@sh/interfaces';
import { RoundFormat } from '@sh/enums';
import { checkErrorsBeforeResultSubmission, getUserInfo, limitRequests } from '~/helpers/utilityFunctions';
import { useSearchParams } from 'next/navigation';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';

const userInfo: IUserInfo = getUserInfo();

const SubmitResultsPage = () => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [resultsSubmissionInfo, setResultsSubmissionInfo] = useState<IResultsSubmissionInfo>();
  const [resultFormResetTrigger, setResultFormResetTrigger] = useState(true);
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
    myFetch
      .get(`/results/submission-info/${new Date()}`, { authorize: true })
      .then(({ payload, errors }: { payload?: IResultsSubmissionInfo; errors?: string[] }) => {
        if (errors) {
          setErrorMessages(errors);
        } else {
          console.log('Submission info:', payload);
          setResultsSubmissionInfo(payload);

          const event = payload.events.find((el: IEvent) => el.eventId === searchParams.get('eventId'));
          if (event) setEvent(event);
          else setEvent(payload.events[0]);
        }
      });
  }, []);

  // Scroll to the top of the page when a new error message is shown
  useEffect(() => {
    if (successMessage || errorMessages.length > 0) window.scrollTo(0, 0);
  }, [errorMessages, successMessage]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const submitResult = async () => {
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

    checkErrorsBeforeResultSubmission(
      newResult,
      event,
      competitors,
      setErrorMessages,
      setSuccessMessage,
      async (newResultWithBestAndAverage) => {
        setLoadingDuringSubmit(true);

        console.log('New result:', newResultWithBestAndAverage, newResultWithBestAndAverage.date.toUTCString());

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
      },
      true, // require at least one non-DNF/DNS result
    );
  };

  const changeDate = (newDate: Date) => {
    setErrorMessages([]);
    setSuccessMessage('');
    setDate(newDate);

    // Update the record pairs with the new date
    if (newDate) {
      limitRequests(fetchRecordPairsTimer, setFetchRecordPairsTimer, async () => {
        const { payload, errors } = await myFetch.get(`/results/submission-info/${newDate}`, { authorize: true });

        if (errors) setErrorMessages(errors);
        else setResultsSubmissionInfo(payload);
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
      <>
        <h2 className="text-center">Submit Result</h2>

        <div className="mt-3 mx-auto px-3 fs-6" style={{ maxWidth: '900px' }}>
          <p>
            Here you can submit results for events that allow submissions. They will be included in the rankings after
            an admin approves them. A result can only be accepted if it has video evidence of the entire solve
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
                3. For team events, every participant must use a different scramble, must be in the same place, and
                should be visible at the same time, if possible.
              </p>
              <p>4. If you&apos;re submitting a Mean of 3, there must be no cuts between the solves.</p>
              <p>*. Bonus points if it&apos;s visible that a new scramble was generated and applied.</p>
            </div>
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
          <FormTextInput
            id="discussion_link"
            title="Link to discussion (optional)"
            placeholder="E.g: https://speedsolving.com/threads/xyz"
            value={discussionLink}
            setValue={setDiscussionLink}
            nextFocusTargetId="submit_button"
          />
          <Button
            id="submit_button"
            text="Submit"
            onClick={submitResult}
            loading={loadingDuringSubmit || fetchRecordPairsTimer !== null}
          />
        </Form>
      </>
    );
  }

  return <Loading errorMessages={errorMessages} />;
};

export default SubmitResultsPage;
