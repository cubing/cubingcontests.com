'use client';

import { useState } from 'react';
import myFetch from '~/helpers/myFetch';
import Form from '@c/form/Form';
import { IRecordType } from '@sh/interfaces';
import { Color, WcaRecordType } from '@sh/enums';
import defaultRecordTypes from '~/helpers/defaultRecordTypes';

const RecordTypesForm = ({ recordTypes }: { recordTypes: IRecordType[] }) => {
  const [errorMessages, setErrorMessages] = useState<string[]>((recordTypes as any).errors || []);
  // Temporary record types
  const [tRecordTypes, setTRecordTypes] = useState<IRecordType[]>(
    recordTypes?.length > 0 ? recordTypes : defaultRecordTypes,
  );

  const handleSubmit = async () => {
    console.log('New record types:', tRecordTypes);
    const { errors } = await myFetch.post('/record-types', tRecordTypes);

    if (errors) {
      setErrorMessages(errors);
    } else {
      window.location.href = '/admin';
    }
  };

  const changeLabel = (wcaEquivalent: WcaRecordType, value: string) => {
    setTRecordTypes(tRecordTypes.map((rt) => (rt.wcaEquivalent === wcaEquivalent ? { ...rt, label: value } : rt)));
  };

  const changeActive = (wcaEquivalent: WcaRecordType) => {
    setTRecordTypes(
      tRecordTypes.map((rt) => (rt.wcaEquivalent === wcaEquivalent ? { ...rt, active: !rt.active } : rt)),
    );
  };

  const changeColor = (wcaEquivalent: WcaRecordType, color: Color) => {
    setTRecordTypes(tRecordTypes.map((rt) => (rt.wcaEquivalent === wcaEquivalent ? { ...rt, color } : rt)));
  };

  return (
    <Form
      buttonText={recordTypes?.length > 0 ? 'Edit' : 'Create'}
      errorMessages={errorMessages}
      handleSubmit={handleSubmit}
    >
      <div className="">
        {tRecordTypes.map((rt) => (
          <div key={rt.wcaEquivalent} className="row mb-3">
            <label htmlFor={rt.wcaEquivalent + '_label_input'} className="col-2 form-label">
              {rt.wcaEquivalent}&#8194;label
            </label>
            <div className="col-2">
              <input
                type="text"
                id={rt.wcaEquivalent + '_label_input'}
                value={rt.label}
                onChange={(e: any) => changeLabel(rt.wcaEquivalent, e.target.value)}
                disabled={recordTypes?.length > 0}
                className="form-control"
              />
            </div>
            <div className="col-1" />
            <div className="col-3 ps-5 form-check">
              <input
                className="form-check-input"
                type="checkbox"
                checked={rt.active}
                onChange={() => changeActive(rt.wcaEquivalent)}
                id={rt.wcaEquivalent + '_checkbox'}
              />
              <label className="form-check-label" htmlFor={rt.wcaEquivalent + '_checkbox'}>
                Active
              </label>
            </div>
            <label htmlFor="color_select" className="col-1 form-label">
              Color
            </label>
            <div className="col-3">
              <select
                id="color_select"
                className="form-select"
                value={rt.color}
                onChange={(e) => changeColor(rt.wcaEquivalent, e.target.value as Color)}
              >
                {Object.keys(Color).map((el: string) => (
                  <option key={el} value={(Color as any)[el]}>
                    {el}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </Form>
  );
};

export default RecordTypesForm;
