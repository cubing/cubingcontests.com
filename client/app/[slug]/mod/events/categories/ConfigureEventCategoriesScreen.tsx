"use client";

import { faEyeSlash, faPencil, faVideo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAction } from "next-safe-action/hooks";
import { useContext, useState } from "react";
import Form from "~/app/components/form/Form.tsx";
import FormCheckbox from "~/app/components/form/FormCheckbox.tsx";
import FormNumberInput from "~/app/components/form/FormNumberInput.tsx";
import FormTextArea from "~/app/components/form/FormTextArea.tsx";
import FormTextInput from "~/app/components/form/FormTextInput.tsx";
import Button from "~/app/components/UI/Button.tsx";
import ColorSquare from "~/app/components/UI/ColorSquare.tsx";
import { MainContext } from "~/helpers/contexts.ts";
import type { ListPageMode } from "~/helpers/types.ts";
import { getActionError } from "~/helpers/utility-functions.ts";
import type { EventCategoryDto } from "~/helpers/validators/EventCategory.ts";
import type { SelectEventCategory } from "~/server/db/schema/event-categories.ts";
import {
  createEventCategorySF,
  updateEventCategorySF,
} from "~/server/server-functions/event-category-server-functions.ts";

type Props = {
  eventCategories: SelectEventCategory[];
};

function ConfigureEventCategoriesScreen({ eventCategories: initEventCategories }: Props) {
  const { changeErrorMessages, changeSuccessMessage, resetMessages } = useContext(MainContext);

  const { executeAsync: createEventCategory, isPending: isCreating } = useAction(createEventCategorySF);
  const { executeAsync: updateEventCategory, isPending: isUpdating } = useAction(updateEventCategorySF);
  const [categories, setCategories] = useState(initEventCategories);
  const [mode, setMode] = useState<ListPageMode>("view");
  const [editId, setEditId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [rank, setRank] = useState<number | undefined>();
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#fff");
  const [hidden, setHidden] = useState(false);
  const [videoBased, setVideoBased] = useState(false);

  const isPending = isCreating || isUpdating;

  categories.sort((a, b) => a.rank - b.rank);

  const handleSubmit = async () => {
    const dto = {
      categoryId,
      rank: rank as number,
      name,
      shortName: shortName || null,
      description: description || null,
      color,
      hidden,
      videoBased,
    } satisfies EventCategoryDto;

    const res =
      mode === "add"
        ? await createEventCategory({ newEventCategoryDto: dto })
        : await updateEventCategory({ id: editId!, newEventCategoryDto: dto });

    if (res.serverError || res.validationErrors) {
      changeErrorMessages([getActionError(res)]);
    } else {
      changeSuccessMessage(`Event category successfully ${mode === "add" ? "created" : "updated"}`);
      setMode("view");

      const newCategories =
        mode === "add" ? [...categories, res.data!] : categories.map((c) => (c.id === editId ? res.data! : c));
      setCategories(newCategories);
    }
  };

  const onCreate = () => {
    resetMessages();
    setMode("add");
    setEditId(null);
    setCategoryId("");
    setRank(undefined);
    setName("");
    setShortName("");
    setDescription("");
    setColor("#fff");
    setHidden(false);
    setVideoBased(false);
  };

  const onEdit = (category: SelectEventCategory) => {
    window.scrollTo(0, 0);
    resetMessages();
    setMode("edit");
    setEditId(category.id);
    setCategoryId(category.categoryId);
    setRank(category.rank);
    setName(category.name);
    setShortName(category.shortName ?? "");
    setDescription(category.description ?? "");
    setColor(category.color);
    setHidden(category.hidden);
    setVideoBased(category.videoBased);
  };

  const cancel = () => {
    setMode("view");
    resetMessages();
  };

  return (
    <>
      {mode === "view" ? (
        <Button onClick={onCreate} className="btn-success btn-sm mx-2">
          Create Event Category
        </Button>
      ) : (
        <Form onSubmit={handleSubmit} hideToasts onCancel={cancel} isLoading={isPending}>
          <div className="row mb-3">
            <div className="col">
              <FormTextInput id="category_name" title="Name" value={name} setValue={setName} disabled={isPending} />
            </div>
            <div className="col">
              <FormTextInput
                id="category_short_name"
                title="Short name (optional)"
                tooltip="Displayed when space is limited"
                value={shortName}
                setValue={setShortName}
                disabled={isPending}
              />
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-5">
              <FormTextInput
                id="category_id"
                title="Category ID"
                tooltip="This alphanumeric ID is displayed in the URL in some areas (e.g. the records page)"
                value={categoryId}
                setValue={setCategoryId}
                disabled={isPending}
              />
            </div>
            <div className="col-5">
              <FormNumberInput
                id="category_rank"
                title="Rank"
                tooltip="Determines the order event categories are displayed in (e.g. on the rankings page)"
                value={rank}
                setValue={setRank}
                disabled={isPending}
                integer
                min={1}
              />
            </div>
            <div className="col-2">
              <label htmlFor="color_input" className="form-label fw-semibold d-block mb-2">
                Color
              </label>
              <input
                id="color_input"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
          <FormTextArea
            id="category_description"
            title="Description (optional)"
            value={description}
            setValue={setDescription}
            rows={3}
            disabled={isPending}
            className="mb-3"
          />

          <h5 className="mb-3">Options</h5>
          <FormCheckbox
            title="Hidden"
            selected={hidden}
            setSelected={setHidden}
            disabled={isPending}
            className="mb-3"
          />
          <FormCheckbox
            title="Video-based"
            selected={videoBased}
            setSelected={setVideoBased}
            disabled={isPending}
            className="mb-4"
          />
        </Form>
      )}

      <div className="table-responsive my-3">
        <table className="table-hover table text-nowrap">
          <thead>
            <tr>
              <th scope="col">Category ID</th>
              <th scope="col">Name</th>
              <th scope="col">Short name</th>
              <th scope="col">Rank</th>
              <th scope="col">Color</th>
              <th scope="col">Options</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.categoryId}</td>
                <td>{category.name}</td>
                <td>{category.shortName}</td>
                <td
                  className={
                    categories.some((e) => e.id !== category.id && e.rank === category.rank)
                      ? "fw-bold text-danger"
                      : ""
                  }
                >
                  {category.rank}
                </td>
                <td>
                  <ColorSquare color={category.color} style={{ height: "1.5rem", width: "1.8rem", margin: 0 }} />
                </td>
                <td>
                  <div className="d-flex gap-2">
                    {category.hidden && (
                      <span title="Hidden">
                        <FontAwesomeIcon icon={faEyeSlash} />
                      </span>
                    )}
                    {category.videoBased && (
                      <span title="Video-based">
                        <FontAwesomeIcon icon={faVideo} />
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <Button
                    onClick={() => onEdit(category)}
                    disabled={isPending}
                    className="btn-xs"
                    title="Edit"
                    ariaLabel="Edit"
                  >
                    <FontAwesomeIcon icon={faPencil} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default ConfigureEventCategoriesScreen;
