"use client";

import { useState } from "react";
import { useMyFetch } from "~/helpers/customHooks.ts";
import Form from "~/app/components/form/Form.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import ColorSquare from "~/app/components/UI/ColorSquare.tsx";
import { IRecordType } from "@cc/shared";
import { Color, WcaRecordType } from "@cc/shared";
import { colorOptions } from "~/helpers/multipleChoiceOptions.ts";

const RecordTypesForm = ({ recordTypes }: { recordTypes: IRecordType[] }) => {
  const myFetch = useMyFetch();

  const [temporaryRTs, setTemporaryRTs] = useState<IRecordType[]>(recordTypes);

  const handleSubmit = async () => {
    const { errors } = await myFetch.post("/record-types", temporaryRTs, {
      loadingId: "form_submit_button",
      keepLoadingOnSuccess: true,
    });
    if (!errors) window.location.href = "/mod";
  };

  const changeLabel = (wcaEquivalent: WcaRecordType, value: string) => {
    setTemporaryRTs(
      temporaryRTs.map((rt: IRecordType) => (rt.wcaEquivalent === wcaEquivalent ? { ...rt, label: value } : rt)),
    );
  };

  const changeActive = (wcaEquivalent: WcaRecordType) => {
    setTemporaryRTs(
      temporaryRTs.map((rt: IRecordType) => (rt.wcaEquivalent === wcaEquivalent ? { ...rt, active: !rt.active } : rt)),
    );
  };

  const changeColor = (wcaEquivalent: WcaRecordType, color: Color) => {
    setTemporaryRTs(
      temporaryRTs.map((rt: IRecordType) => (rt.wcaEquivalent === wcaEquivalent ? { ...rt, color } : rt)),
    );
  };

  return (
    <Form buttonText="Save" onSubmit={handleSubmit}>
      {temporaryRTs.map((rt: IRecordType) => (
        <div key={rt.wcaEquivalent} className="row align-items-center mb-3 text-nowrap">
          <div className="d-none d-md-block col-2">
            <label htmlFor={rt.wcaEquivalent + "_label_input"} className="form-label mb-0">
              {rt.wcaEquivalent}&#8194;label
            </label>
          </div>
          <div className="col-3 col-md-2 pe-0">
            <input
              type="text"
              id={rt.wcaEquivalent + "_label_input"}
              value={rt.label}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                changeLabel(rt.wcaEquivalent, e.target.value)}
              disabled={rt.wcaEquivalent !== WcaRecordType.WR} // TEMPORARY
              className="form-control"
            />
          </div>
          <div className="col-3 col-md-3 ps-md-5 pe-0">
            <FormCheckbox
              title="Active"
              id={rt.wcaEquivalent}
              selected={rt.active}
              setSelected={() =>
                changeActive(rt.wcaEquivalent)}
              disabled={rt.wcaEquivalent !== WcaRecordType.WR} // TEMPORARY
              noMargin
            />
          </div>
          <div className="col-6 col-md-5">
            <span className="d-flex align-items-center gap-2 gap-md-3">
              <label htmlFor="color_select" className="form-label mb-0">Color</label>

              <select
                id="color_select"
                className="form-select"
                value={rt.color}
                onChange={(e) => changeColor(rt.wcaEquivalent, e.target.value as Color)}
                disabled={rt.wcaEquivalent !== WcaRecordType.WR} // TEMPORARY
              >
                {colorOptions
                  .filter((el) => ![Color.White, Color.Magenta].includes(el.value as any))
                  .map((colorOption) => (
                    <option key={colorOption.value} value={colorOption.value}>{colorOption.label}</option>
                  ))}
              </select>

              <ColorSquare color={rt.color} style={{ minWidth: "2.1rem" }} />
            </span>
          </div>
        </div>
      ))}
    </Form>
  );
};

export default RecordTypesForm;
