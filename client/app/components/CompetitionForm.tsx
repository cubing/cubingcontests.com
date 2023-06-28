'use client';

import './CompetitionForm.css';
import { useState } from 'react';
import myFetch from '~/helpers/myFetch';
import DatePicker from 'react-datepicker';
// import DatePicker, { registerLocale, setDefaultLocale } from 'react-datepicker';
// import enGB from 'date-fns/locale/en-GB';
import 'react-datepicker/dist/react-datepicker.css';
import Countries from '@sh/Countries';
import IEvent from '@sh/interfaces/Event';
import Form from './form/Form';
import FormTextInput from './form/FormTextInput';

// registerLocale('en-GB', enGB);
// setDefaultLocale('en-GB');

const CompetitionForm = ({ events }: { events: IEvent[] }) => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [competitionId, setCompetitionId] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [countryId, setCountryId] = useState<string>(Countries[0].code);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [mainEventId, setMainEventId] = useState<string>('333');

  const handleSubmit = async () => {
    const competition = {
      competitionId,
      name,
      city,
      countryId,
      startDate,
      endDate,
      mainEventId,
    };

    const response = await myFetch.post('/competitions', competition, { authorize: true });

    if (response?.errors) {
      setErrorMessages(response.errors);
    } else {
      window.location.href = '/contests';
    }
  };

  return (
    <Form buttonText="Create" errorMessages={errorMessages} handleSubmit={handleSubmit}>
      <FormTextInput name="Competition ID" value={competitionId} setValue={setCompetitionId} />
      <FormTextInput name="Competition Name" value={name} setValue={setName} />
      <div className="row">
        <div className="col">
          <FormTextInput name="City" value={city} setValue={setCity} />
        </div>
        <div className="col">
          <label htmlFor="country_id" className="form-label">
            Country
          </label>
          <select id="country_id" className="form-select" onChange={(e) => setCountryId(e.target.value)}>
            {Countries.map((el) => (
              <option key={el.code} value={el.code}>
                {el.name}
              </option>
            ))}
          </select>
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
            // locale="en-GB"
            onChange={(date: Date) => setStartDate(date)}
            className="form-control"
          />
        </div>
        <div className="col">
          <label htmlFor="end_date" className="form-label">
            End Date
          </label>
          <DatePicker
            id="end_date"
            selected={endDate}
            onChange={(date: Date) => setEndDate(date)}
            className="form-control"
          />
        </div>
      </div>
      <div className="mb-3">
        <label htmlFor="main_event_id" className="form-label">
          Main Event
        </label>
        <select id="main_event_id" className="form-select" onChange={(e) => setMainEventId(e.target.value)}>
          {events.map((el: IEvent) => (
            <option key={el.eventId} value={el.eventId}>
              {el.name}
            </option>
          ))}
        </select>
      </div>
    </Form>
  );
};

export default CompetitionForm;
