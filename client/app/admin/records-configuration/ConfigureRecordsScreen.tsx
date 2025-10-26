"use client";

import { useContext, useState } from "react";
import Form from "~/app/components/form/Form.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import ColorSquare from "~/app/components/UI/ColorSquare.tsx";
import { RecordConfigResponse } from "~/server/db/schema/record-configs.ts";
import { ListPageMode, RecordCategory, RecordCategoryValues, RecordType, RecordTypeValues } from "~/helpers/types.ts";
import Button from "~/app/components/UI/Button.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import FormSelect from "~/app/components/form/FormSelect.tsx";
import { MultiChoiceOption } from "~/helpers/types/MultiChoiceOption.ts";
import FormNumberInput from "~/app/components/form/FormNumberInput.tsx";
import ActiveInactiveIcon from "~/app/components/UI/ActiveInactiveIcon.tsx";
import ToastMessages from "~/app/components/UI/ToastMessages.tsx";
import { useAction } from "next-safe-action/hooks";
import { createRecordConfigSF, updateRecordConfigSF } from "~/server/serverFunctions/recordConfigServerFunctions.ts";
import { RecordConfigDto } from "~/helpers/validators/RecordConfig.ts";
import { getActionError } from "~/helpers/utilityFunctions.ts";
import { Continents } from "~/helpers/Countries.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faPencil } from "@fortawesome/free-solid-svg-icons";

const recordForOptions: MultiChoiceOption[] = [
  {
    value: "competitions",
    label: "Competitions",
  },
  {
    value: "meetups",
    label: "Meetups",
  },
  {
    value: "video-based-results",
    label: "Video-based results",
  },
];
const recordTypeOptions: MultiChoiceOption[] = RecordTypeValues.map((v) => ({ value: v, label: v }));

type Props = {
  recordConfigs: RecordConfigResponse[];
};

function ConfigureRecordsScreen({ recordConfigs: initRecordConfigs }: Props) {
  const { changeErrorMessages, changeSuccessMessage, resetMessages } = useContext(MainContext);

  const { executeAsync: createRecordConfig, isPending: isCreating } = useAction(createRecordConfigSF);
  const { executeAsync: updateRecordConfig, isPending: isUpdating } = useAction(updateRecordConfigSF);
  const [mode, setMode] = useState<ListPageMode>("view");
  const [recordConfigs, setRecordConfigs] = useState(initRecordConfigs);

  const [recordConfigIdUnderEdit, setRecordConfigIdUnderEdit] = useState<number | undefined>();
  const [category, setCategory] = useState<RecordCategory>(RecordCategoryValues[0]);
  const [recordTypeId, setRecordTypeId] = useState<RecordType>(RecordTypeValues[0]);
  const [label, setLabel] = useState("");
  const [active, setActive] = useState(true);
  const [rank, setRank] = useState<number | undefined>();
  const [color, setColor] = useState("#dc3545");

  const isPending = isCreating || isUpdating;

  const handleSubmit = async () => {
    const newRecordConfigDto = {
      category,
      recordTypeId,
      label,
      active,
      rank: rank!,
      color,
    } satisfies RecordConfigDto;

    const res = mode === "add"
      ? await createRecordConfig({ newRecordConfigDto })
      : await updateRecordConfig({ id: recordConfigIdUnderEdit!, newRecordConfigDto });

    if (res.serverError || res.validationErrors) {
      changeErrorMessages([getActionError(res)]);
    } else {
      changeSuccessMessage(`Record type successfully ${mode === "add" ? "created" : "updated"}`);
      setMode("view");

      const newRecordConfigs = mode === "add"
        ? [...recordConfigs, res.data!]
        : recordConfigs.map((rc) => rc.id === recordConfigIdUnderEdit ? res.data! : rc);
      newRecordConfigs.sort((a, b) => a.rank - b.rank);
      setRecordConfigs(newRecordConfigs);
    }
  };

  const onAddRecordConfig = () => {
    resetMessages();
    setMode("add");

    setRecordConfigIdUnderEdit(undefined);
    setCategory("competitions");
    setRecordTypeId("WR");
    setLabel("");
    setActive(true);
    setRank(undefined);
    setColor("#dc3545");
  };

  const onEditRecordConfig = (recordConfig: RecordConfigResponse, clone = false) => {
    window.scrollTo(0, 0);
    resetMessages();
    setMode(clone ? "add" : "edit");

    setRecordConfigIdUnderEdit(clone ? undefined : recordConfig.id);
    setCategory(recordConfig.category);
    setRecordTypeId(recordConfig.recordTypeId);
    setLabel(recordConfig.label);
    setActive(recordConfig.active);
    setRank(recordConfig.rank);
    setColor(recordConfig.color);
  };

  const cancel = () => {
    setMode("view");
    resetMessages();
  };

  const changeRecordTypeId = (newRecordTypeId: RecordType) => {
    setRecordTypeId(newRecordTypeId);

    if (newRecordTypeId === "WR") setColor("#dc3545");
    else if (Continents.map((c) => c.recordTypeId).includes(newRecordTypeId)) setColor("#ffc107");
    else if (newRecordTypeId === "NR") setColor("#198754");
    else setColor("#0d6efd");
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
                  title="Record For"
                  options={recordForOptions}
                  selected={category}
                  setSelected={setCategory}
                  disabled={isPending}
                />
              </div>
              <div className="col">
                <FormSelect
                  title="Record Type"
                  options={recordTypeOptions}
                  selected={recordTypeId}
                  setSelected={changeRecordTypeId}
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="row mb-3">
              <div className="col">
                <FormTextInput
                  id="record_config_label"
                  title="Label"
                  value={label}
                  setValue={setLabel}
                  disabled={isPending}
                />
              </div>
              <div className="col">
                <FormNumberInput
                  title="Rank"
                  tooltip="Only used for ordering the record types on this page"
                  value={rank}
                  setValue={setRank}
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="row mb-3">
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
              <div className="col">
                <FormCheckbox
                  title="Active"
                  selected={active}
                  setSelected={setActive}
                  disabled={isPending}
                />
              </div>
            </div>
          </Form>
        )}

      <p className="mt-3">
        Note: the code assumes that if there is an active NR or CR record type, the WR record type and all CR record
        types under that category are also active.
      </p>

      <div className="my-4 table-responsive">
        <table className="table table-hover text-nowrap">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Record category</th>
              <th scope="col">Record type</th>
              <th scope="col">Label</th>
              <th scope="col">Rank</th>
              <th scope="col">Color</th>
              <th scope="col">Active</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recordConfigs.map((recordConfig, index) => (
              <tr key={recordConfig.id}>
                <td>{index + 1}</td>
                <td>{recordForOptions.find((rf) => rf.value === recordConfig.category)?.label}</td>
                <td>{recordConfig.recordTypeId}</td>
                <td>{recordConfig.label}</td>
                <td>{recordConfig.rank}</td>
                <td>
                  <ColorSquare color={recordConfig.color} small />
                </td>
                <td>
                  <ActiveInactiveIcon isActive={recordConfig.active} />
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      onClick={() => onEditRecordConfig(recordConfig)}
                      disabled={mode !== "view"}
                      className="btn-xs"
                      title="Edit"
                      ariaLabel="Edit"
                    >
                      <FontAwesomeIcon icon={faPencil} />
                    </Button>
                    <Button
                      onClick={() => onEditRecordConfig(recordConfig, true)}
                      disabled={mode !== "view"}
                      className="btn-xs"
                      title="Clone"
                      aria-label="Clone"
                    >
                      <FontAwesomeIcon icon={faCopy} />
                    </Button>
                  </div>
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
