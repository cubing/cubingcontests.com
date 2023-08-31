'use client';

import { useEffect, useMemo, useState } from 'react';
import DatePicker, { registerLocale, setDefaultLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import enGB from 'date-fns/locale/en-GB';
import Loading from '@c/Loading';
import Form from '@c/form/Form';
import myFetch from '~/helpers/myFetch';
import { IEvent, IPerson, IResult, IResultsSubmissionInfo } from '~/shared_helpers/interfaces';
import FormTextInput from '~/app/components/form/FormTextInput';
import ResultForm from '~/app/components/adminAndModerator/ResultForm';
import { checkErrorsBeforeSubmit, limitRequests } from '~/helpers/utilityFunctions';
import { RoundFormat } from '~/shared_helpers/enums';

registerLocale('en-GB', enGB);
setDefaultLocale('en-GB');

const SubmitResults = () => {
  const [resultsSubmissionInfo, setResultsSubmissionInfo] = useState<IResultsSubmissionInfo>();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [resultFormResetTrigger, setResultFormResetTrigger] = useState(true);
  const [fetchRecordPairsTimer, setFetchRecordPairsTimer] = useState<NodeJS.Timeout>(null);

  const [event, setEvent] = useState<IEvent>();
  const [roundFormat, setRoundFormat] = useState<RoundFormat>();
  const [attempts, setAttempts] = useState<string[]>([]);
  const [date, setDate] = useState(new Date());
  const [competitors, setCompetitors] = useState<IPerson[]>([null]);
  const [videoLink, setVideoLink] = useState('');
  const [discussionLink, setDiscussionLink] = useState('');

  const recordPairs = useMemo(
    () => resultsSubmissionInfo?.recordPairsByEvent.find((el) => el.eventId === event.eventId)?.recordPairs,
    [resultsSubmissionInfo, event],
  );

  useEffect(() => {
    fetchSubmissionInfo(date).then((payload: IResultsSubmissionInfo) => {
      setResultsSubmissionInfo(payload as IResultsSubmissionInfo);
      setEvent(payload.events[0]);
      setRoundFormat(payload.events[0].defaultRoundFormat);
    });
  }, []);

  // Scroll to the top of the page when a new error message is shown
  useEffect(() => {
    if (successMessage || errorMessages.some((el) => el !== '')) window.scrollTo(0, 0);
  }, [errorMessages, successMessage]);

  const fetchSubmissionInfo = async (recordsUpTo: Date) => {
    const { payload, errors } = await myFetch.get(`/results/submission-info?records_up_to=${recordsUpTo}`, {
      authorize: true,
    });

    if (errors) {
      setErrorMessages(errors);
      Promise.reject();
    } else {
      setErrorMessages([]);
      return payload;
    }
  };

  const handleSubmit = async () => {
    // Validation
    const tempErrors: string[] = [];

    if (!date) tempErrors.push('Please enter a valid date');
    if (!videoLink.trim()) tempErrors.push('Please enter the link to a video showing the solves as proof');

    if (tempErrors.length > 0) {
      setErrorMessages(tempErrors);
    } else {
      checkErrorsBeforeSubmit(
        attempts,
        roundFormat,
        event,
        competitors,
        setErrorMessages,
        setSuccessMessage,
        async ({ parsedAttempts, best, average }) => {
          const newResult: IResult = {
            eventId: event.eventId,
            date,
            personIds: competitors.map((el) => el.personId),
            attempts: parsedAttempts,
            best,
            average,
            videoLink,
            discussionLink,
          };

          const { errors } = await myFetch.post('/results', newResult);

          if (errors) {
            setErrorMessages(errors);
          } else {
            setSuccessMessage('Successfully submitted');
            setVideoLink('');
            setResultFormResetTrigger(!resultFormResetTrigger);
          }
        },
        true, // require at least one non-DNF/DNS result
      );
    }
  };

  const onVideoLinkKeyDown = (e: any) => {
    if (e.key === 'Enter') document.getElementById('discussion_link').focus();
  };

  const onDiscussionLinkKeyDown = (e: any) => {
    if (e.key === 'Enter') document.getElementById('form_submit_button').focus();
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

  if (resultsSubmissionInfo) {
    return (
      <>
        <h2 className="text-center">Submit Result</h2>
        <Form
          buttonText="Submit"
          errorMessages={errorMessages}
          successMessage={successMessage}
          handleSubmit={handleSubmit}
          disableButton={fetchRecordPairsTimer !== null}
        >
          <ResultForm
            event={event}
            setEvent={setEvent}
            events={resultsSubmissionInfo.events}
            persons={competitors}
            setPersons={setCompetitors}
            attempts={attempts}
            setAttempts={setAttempts}
            roundFormat={roundFormat}
            setRoundFormat={setRoundFormat}
            recordPairs={recordPairs}
            loadingRecordPairs={fetchRecordPairsTimer !== null}
            recordTypes={resultsSubmissionInfo.activeRecordTypes}
            nextFocusTargetId="video_link"
            setErrorMessages={setErrorMessages}
            setSuccessMessage={setSuccessMessage}
            resetTrigger={resultFormResetTrigger}
          />
          <div className="mb-3">
            <label htmlFor="start_date" className="d-block form-label">
              Date
            </label>
            <DatePicker
              selected={date}
              dateFormat="P"
              locale="en-GB"
              onChange={(date: Date) => changeDate(date)}
              className="form-control"
            />
          </div>
          <FormTextInput
            id="video_link"
            title="Link to video"
            placeholder="https://youtube.com/watch?v=xyz"
            value={videoLink}
            setValue={setVideoLink}
            onKeyDown={onVideoLinkKeyDown}
          />
          <FormTextInput
            id="discussion_link"
            title="Link to discussion (optional)"
            placeholder="https://speedsolving.com/threads/xyz"
            value={discussionLink}
            setValue={setDiscussionLink}
            onKeyDown={onDiscussionLinkKeyDown}
          />
        </Form>
      </>
    );
  }

  return <Loading errorMessages={errorMessages} />;
};

export default SubmitResults;
