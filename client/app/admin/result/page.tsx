'use client';

import { useEffect, useState } from 'react';
import DatePicker, { registerLocale, setDefaultLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import enGB from 'date-fns/locale/en-GB';
import Loading from '@c/Loading';
import Form from '@c/form/Form';
import myFetch from '~/helpers/myFetch';
import { IEvent, IPerson, IResult } from '~/shared_helpers/interfaces';
import FormTextInput from '~/app/components/form/FormTextInput';
import ResultForm from '~/app/components/adminAndModerator/ResultForm';
import { submitResult } from '~/helpers/utilityFunctions';
import { EventGroup, RoundFormat } from '~/shared_helpers/enums';
import { getDateOnly } from '~/shared_helpers/sharedFunctions';
import { roundFormats } from '~/helpers/roundFormats';

registerLocale('en-GB', enGB);
setDefaultLocale('en-GB');

const SubmitResult = () => {
  const [submissionBasedEvents, setSubmissionBasedEvents] = useState<IEvent[]>();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  const [event, setEvent] = useState<IEvent>();
  const [roundFormat, setRoundFormat] = useState<RoundFormat>();
  const [attempts, setAttempts] = useState<string[]>([]);
  const [date, setDate] = useState(new Date());
  const [competitors, setCompetitors] = useState<IPerson[]>([null]);
  const [videoLink, setVideoLink] = useState('');

  useEffect(() => {
    myFetch.get('/events?submission_based=true').then(({ payload, errors }) => {
      if (errors) setErrorMessages(errors);
      else {
        setSubmissionBasedEvents(payload as IEvent[]);
        setEvent(payload[0]);
        setRoundFormat(payload[0].defaultRoundFormat);
      }
    });
  }, []);

  // Scroll to the top of the page when a new error message is shown
  useEffect(() => {
    if (successMessage || errorMessages.some((el) => el !== '')) window.scrollTo(0, 0);
  }, [errorMessages, successMessage]);

  const handleSubmit = async () => {
    submitResult(
      attempts,
      roundFormat,
      event,
      competitors,
      setErrorMessages,
      async ({ parsedAttempts, best, average }) => {
        const newResult: IResult = {
          eventId: event.eventId,
          date: getDateOnly(date),
          personIds: competitors.map((el) => el.personId),
          attempts: parsedAttempts,
          best,
          average,
          videoLink,
        };

        const { errors } = await myFetch.post('/results', newResult);

        if (errors) {
          setErrorMessages(errors);
        } else {
          setErrorMessages([]);
          setSuccessMessage('Successfully submitted');
          setVideoLink('');
          setCompetitors(Array(event.participants || 1).fill(null));
          setAttempts(Array(roundFormats[roundFormat].attempts).fill(''));

          document.getElementById('Competitor_1').focus();
        }
      },
    );
  };

  if (submissionBasedEvents) {
    return (
      <>
        <h2 className="text-center">Submit Result</h2>
        <Form
          buttonText="Submit"
          errorMessages={errorMessages}
          successMessage={successMessage}
          handleSubmit={handleSubmit}
        >
          <ResultForm
            event={event}
            setEvent={setEvent}
            events={submissionBasedEvents}
            persons={competitors}
            setPersons={setCompetitors}
            attempts={attempts}
            setAttempts={setAttempts}
            roundFormat={roundFormat}
            setRoundFormat={setRoundFormat}
            nextFocusTargetId="video_link"
            setErrorMessages={setErrorMessages}
            setSuccessMessage={setSuccessMessage}
          />
          <div className="mb-3">
            <label htmlFor="start_date" className="d-block form-label">
              Date
            </label>
            <DatePicker
              selected={date}
              dateFormat="P"
              locale="en-GB"
              onChange={(date: Date) => setDate(date)}
              className="form-control"
            />
          </div>
          <FormTextInput
            id="video_link"
            title="Link to video"
            placeholder="https://youtube.com/watch?v=xyz"
            value={videoLink}
            setValue={setVideoLink}
          />
        </Form>
      </>
    );
  }

  return <Loading errorMessages={errorMessages} />;
};

export default SubmitResult;
