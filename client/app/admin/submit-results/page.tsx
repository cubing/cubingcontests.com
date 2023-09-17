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
import { Role, RoundFormat } from '@sh/enums';
import { checkErrorsBeforeSubmit, getRole, limitRequests } from '~/helpers/utilityFunctions';

const SubmitResults = () => {
  const [resultsSubmissionInfo, setResultsSubmissionInfo] = useState<IResultsSubmissionInfo>();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
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

  const recordPairs = useMemo(
    () => resultsSubmissionInfo?.recordPairsByEvent.find((el) => el.eventId === event.eventId)?.recordPairs,
    [resultsSubmissionInfo, event],
  );
  const role = useMemo(getRole, [getRole]);

  const isAdmin = role === Role.Admin;

  useEffect(() => {
    fetchSubmissionInfo(new Date()).then((payload: IResultsSubmissionInfo) => {
      setResultsSubmissionInfo(payload as IResultsSubmissionInfo);
      setEvent(payload.events[0]);
    });
  }, []);

  // Scroll to the top of the page when a new error message is shown
  useEffect(() => {
    if (successMessage || errorMessages.some((el) => el !== '')) window.scrollTo(0, 0);
  }, [errorMessages, successMessage]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const fetchSubmissionInfo = async (recordsUpTo: Date): Promise<IResultsSubmissionInfo> => {
    const { payload, errors } = await myFetch.get(`/results/submission-info?records_up_to=${recordsUpTo}`, {
      authorize: true,
    });

    if (errors) {
      setErrorMessages(errors);
      Promise.reject();
    } else {
      setErrorMessages([]);
      console.log('Submission info:', payload);
      return payload;
    }
  };

  const submitResult = async () => {
    // Validation
    const tempErrors: string[] = [];

    if (!date) {
      tempErrors.push('Please enter a valid date');
      document.getElementById('date').focus();
    }

    if (!videoUnavailable && !videoLink.trim()) {
      tempErrors.push('Please enter a video link');
      document.getElementById('video_link').focus();
    }

    if (tempErrors.length > 0) {
      setErrorMessages(tempErrors);
    } else {
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

      checkErrorsBeforeSubmit(
        newResult,
        roundFormat,
        event,
        competitors,
        setErrorMessages,
        setSuccessMessage,
        async (newResultWithBestAndAverage) => {
          setLoadingDuringSubmit(true);

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
    }
  };

  const changeDate = (newDate: Date) => {
    setDate(newDate);
    setErrorMessages([]);
    setSuccessMessage('');

    // Update the record pairs with the new date
    if (newDate) {
      limitRequests(fetchRecordPairsTimer, setFetchRecordPairsTimer, () => {
        fetchSubmissionInfo(newDate).then((payload: IResultsSubmissionInfo) => {
          setResultsSubmissionInfo(payload as IResultsSubmissionInfo);
        });
      });
    }
  };

  const onVideoLinkKeyDown = (e: any) => {
    if (e.key === 'Enter') document.getElementById('discussion_link').focus();
  };

  const onVideoLinkFocusOut = () => {
    if (videoLink.includes('youtube.com') && videoLink.includes('&')) {
      // Remove unnecessary params from youtube links
      setVideoLink(videoLink.slice(0, videoLink.indexOf('&')));
    }
  };

  const onDiscussionLinkKeyDown = (e: any) => {
    if (e.key === 'Enter') document.getElementById('submit_button').focus();
  };

  if (resultsSubmissionInfo) {
    return (
      <>
        <h2 className="text-center">Submit Result</h2>
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
            allowUnknownTime={isAdmin && [RoundFormat.BestOf1, RoundFormat.BestOf2].includes(roundFormat)}
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
            placeholder="https://youtube.com/watch?v=xyz"
            value={videoLink}
            setValue={setVideoLink}
            onKeyDown={onVideoLinkKeyDown}
            onBlur={onVideoLinkFocusOut}
            disabled={videoUnavailable}
          />
          {isAdmin && (
            <FormCheckbox title="Video unavailable" selected={videoUnavailable} setSelected={setVideoUnavailable} />
          )}
          <FormTextInput
            id="discussion_link"
            title="Link to discussion (optional)"
            placeholder="https://speedsolving.com/threads/xyz"
            value={discussionLink}
            setValue={setDiscussionLink}
            onKeyDown={onDiscussionLinkKeyDown}
          />
          <Button
            id="submit_button"
            text="Submit"
            onClick={submitResult}
            disabled={fetchRecordPairsTimer !== null}
            loading={loadingDuringSubmit}
          />
        </Form>
      </>
    );
  }

  return <Loading errorMessages={errorMessages} />;
};

export default SubmitResults;
