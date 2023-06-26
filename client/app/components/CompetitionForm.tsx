'use client';
import { useState } from 'react';
import './CompetitionForm.css';
import DatePicker from 'react-datepicker';
// import DatePicker, { registerLocale, setDefaultLocale } from 'react-datepicker';
// import enGB from 'date-fns/locale/en-GB';
import 'react-datepicker/dist/react-datepicker.css';
import Countries from '@sh/Countries';
import IEvent from '@sh/interfaces/Event';
import ICompetition from '@sh/interfaces/Competition';

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

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:4000/competitions', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({
          competitionId,
          name,
          city,
          countryId,
          startDate,
          endDate,
          mainEventId,
        } as ICompetition),
      });

      if (response.status !== 201) {
        const json = await response.json();
        // Sometimes the return message is a string and sometimes it's an array
        if (typeof json.message === 'string') setErrorMessages([json.message]);
        else setErrorMessages(json.message);
      } else {
        window.location.href = 'http://localhost:3000/contests';
      }
    } catch (err: any) {
      setErrorMessages([err.message]);
    }
  };

  return (
    <form className="mt-4 mx-auto fs-5" style={{ width: '720px' }} onSubmit={(e: any) => handleSubmit(e)}>
      {errorMessages?.map((message, index) => (
        <div key={index} className="alert alert-danger" role="alert">
          {message}
        </div>
      ))}

      <div className="mb-3">
        <label htmlFor="competition_id" className="form-label">
          Competition ID
        </label>
        <input
          type="text"
          id="competition_id"
          value={competitionId}
          onChange={(e: any) => setCompetitionId(e.target.value)}
          className="form-control"
        />
      </div>
      <div className="mb-3">
        <label htmlFor="name" className="form-label">
          Competition Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e: any) => setName(e.target.value)}
          className="form-control"
        />
      </div>
      <div className="mb-3 row">
        <div className="col">
          <label htmlFor="city" className="form-label">
            City
          </label>
          <input
            type="text"
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="form-control"
          />
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
      <button type="submit" className="mt-4 btn btn-primary">
        Create
      </button>
    </form>
  );
};

export default CompetitionForm;
