'use client';

import { useState } from 'react';
import myFetch from '~/helpers/myFetch';
import Form from '@c/form/Form';
import { IRecordType } from '@sh/interfaces';
import { Color, WcaRecordType } from '@sh/enums';
import { colorOptions } from '~/helpers/multipleChoiceOptions';

const RecordTypesForm = ({ recordTypes }: { recordTypes: IRecordType[] }) => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  // Temporary record types
  const [tRecordTypes, setTRecordTypes] = useState<IRecordType[]>(recordTypes);

  const handleSubmit = async () => {
    console.log('New record types:', tRecordTypes);
    const { errors } = await myFetch.post('/record-types', tRecordTypes);

    if (errors) {
      setErrorMessages(errors);
    } else {
      window.location.href = '/mod';
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
      <>
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
                {colorOptions
                  .filter((el) => el.value !== Color.Magenta)
                  .map((colorOption) => (
                    <option key={colorOption.value} value={colorOption.value}>
                      {colorOption.label}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        ))}
      </>
    </Form>
  );
};

export default RecordTypesForm;
