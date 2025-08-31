"use client";

import { useContext, useState } from "react";
import Form from "~/app/components/form/Form.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import ColorSquare from "~/app/components/UI/ColorSquare.tsx";
import { RecordConfigResponse } from "~/server/db/schema/record-configs.ts";
import { ListPageMode, RegionalRecordTypeValues } from "~/helpers/types.ts";
import Button from "~/app/components/UI/Button.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import FormSelect from "~/app/components/form/FormSelect.tsx";
import { MultiChoiceOption } from "~/helpers/types/MultiChoiceOption.ts";
import FormNumberInput from "~/app/components/form/FormNumberInput.tsx";
import ActiveInactiveIcon from "~/app/components/UI/ActiveInactiveIcon.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { useAction } from "next-safe-action/hooks";
import { createRecordConfigSF } from "~/server/serverFunctions/recordConfigServerFunctions.ts";
import { RecordConfigDto } from "~/helpers/validators/RecordConfig.ts";
import { getActionError } from "~/helpers/utilityFunctions.ts";

const recordTypeOptions: MultiChoiceOption[] = RegionalRecordTypeValues.map((v) => ({ value: v, label: v }));

type Props = {
  recordConfigs: RecordConfigResponse[];
};

function ConfigureRecordsScreen({ recordConfigs: initRecordConfigs }: Props) {
  const { changeErrorMessages, changeSuccessMessage, resetMessages } = useContext(MainContext);

  const { executeAsync: createRecordConfig, isPending: isCreating } = useAction(createRecordConfigSF);
  const [mode, setMode] = useState<ListPageMode>("view");
  const [recordConfigs, setRecordConfigs] = useState(initRecordConfigs);

  const [recordTypeId, setRecordTypeId] = useState<string>(RegionalRecordTypeValues[0]);
  const [label, setLabel] = useState("");
  const [active, setActive] = useState(true);
  const [order, setOrder] = useState<number | undefined>();
  const [color, setColor] = useState("#000000");

  const isPending = isCreating;

  const handleSubmit = async () => {
    const newRecordConfig = {
      recordTypeId,
      label,
      active,
      order,
      color,
    } satisfies RecordConfigDto;

    const res = await createRecordConfig({ newRecordConfig });

    if (res.serverError || res.validationErrors) {
      changeErrorMessages([getActionError(res)]);
    } else {
      setRecordConfigs([...recordConfigs, res.data!].sort((a, b) => a.order - b.order));
      setMode("view");
      changeSuccessMessage(`Successfully added record type ${label}`);
    }
  };

  const onAddRecordConfig = () => {
    resetMessages();
    setMode("add");
    setRecordTypeId("WR");
    setLabel("");
    setActive(true);
    setOrder(undefined);
    setColor("#000000");
  };

  const cancel = () => {
    setMode("view");
    resetMessages();
  };

  return (
    <>
      <ToastMessages />

      {mode === "view"
        ? (
          <Button onClick={onAddRecordConfig} className="btn-success btn-sm ms-3">
            Create Record Type
          </Button>
        )
        : (
          <Form
            buttonText="Submit"
            onSubmit={handleSubmit}
            onCancel={cancel}
            hideToasts
            showCancelButton
            isLoading={isPending}
          >
            <div className="row mb-3">
              <div className="col">
                <FormSelect
                  title="Record Type"
                  options={recordTypeOptions}
                  selected={recordTypeId}
                  setSelected={setRecordTypeId}
                  disabled={isPending}
                />
              </div>
              <div className="col">
                <FormTextInput
                  id="record_config_label"
                  title="Label"
                  value={label}
                  setValue={setLabel}
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="row mb-3">
              <div className="col">
                <FormNumberInput
                  title="Order"
                  value={order}
                  setValue={setOrder}
                  disabled={isPending}
                />
              </div>
              <div className="col">
                <label htmlFor="color_input" className="form-label d-block mb-2">Color</label>
                <input
                  id="color_input"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>
            <FormCheckbox
              title="Active"
              selected={active}
              setSelected={setActive}
              disabled={isPending}
            />
          </Form>
        )}

      <div className="my-4 table-responsive">
        <table className="table table-hover text-nowrap">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Record type</th>
              <th scope="col">Label</th>
              <th scope="col">Order</th>
              <th scope="col">Color</th>
              <th scope="col">Active</th>
            </tr>
          </thead>
          <tbody>
            {recordConfigs.map((recordConfig, index) => (
              <tr key={recordConfig.recordTypeId}>
                <td>{index + 1}</td>
                <td>{recordConfig.recordTypeId}</td>
                <td>{recordConfig.label}</td>
                <td>{recordConfig.order}</td>
                <td>
                  <ColorSquare color={recordConfig.color} small />
                </td>
                <td>
                  <ActiveInactiveIcon isActive={recordConfig.active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {
        /* <div
          key={rc.recordTypeId}
          className="row align-items-center mb-3 text-nowrap"
        >
          <div className="d-none d-md-block col-2">
            <label
              htmlFor={rc.recordTypeId + "_label_input"}
              className="form-label mb-0"
            >
              {rc.recordTypeId}&#8194;label
            </label>
          </div>
          <div className="col-3 col-md-2 pe-0">
            <input
              type="text"
              id={rc.recordTypeId + "_label_input"}
              value={rc.label}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => changeLabel(rc.recordTypeId, e.target.value)}
              className="form-control"
            />
          </div>
          <div className="col-3 col-md-3 ps-md-5 pe-0">
            <FormCheckbox
              title="Active"
              id={rc.recordTypeId}
              selected={rc.active}
              setSelected={() => changeActive(rc.recordTypeId)}
              noMargin
            />
          </div>
          <div className="col-6 col-md-5">
            <span className="d-flex align-items-center gap-2 gap-md-3">
              <label htmlFor="color_select" className="form-label mb-0">
                Color
              </label>

              <select
                id="color_select"
                className="form-select"
                value={rc.color}
                onChange={(e) => changeColor(rc.recordTypeId, e.target.value)}
              >
                {colorOptions
                  // .filter((el) => ![Color.White, Color.Magenta].includes(el.value as any))
                  .map((colorOption) => (
                    <option key={colorOption.value} value={colorOption.value}>
                      {colorOption.label}
                    </option>
                  ))}
              </select>

              <ColorSquare color={rc.color} style={{ minWidth: "2.1rem" }} />
            </span>
          </div>
        </div> */
      }
    </>
  );
}

export default ConfigureRecordsScreen;
