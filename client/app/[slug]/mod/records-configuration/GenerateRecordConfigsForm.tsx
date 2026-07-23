import capitalize from "lodash/capitalize";
import type { RecordCategory } from "~/helpers/types.ts";

type Props = {
  recordCategories: RecordCategory[];
  isSubmitting: boolean;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
};

function GenerateRecordConfigsForm({ recordCategories, isSubmitting, onSubmit, onCancel }: Props) {
  return (
    <form action={onSubmit} className="mx-auto my-4 px-3" style={{ maxWidth: "var(--rr-md-width)" }}>
      <div className="row">
        <div className="col-md-6">
          <fieldset className="mb-3">
            <label htmlFor="category_input" className="form-label">
              Record Category
            </label>
            <select id="category_input" name="category" className="form-select">
              {recordCategories.map((rc) => (
                <option key={rc} value={rc}>
                  {capitalize(rc)}
                </option>
              ))}
            </select>
          </fieldset>
        </div>
        <div className="col-md-6">
          <fieldset className="mb-3">
            <label htmlFor="prefix_input" className="form-label">
              Record Label Prefix
            </label>
            <input id="prefix_input" type="text" name="prefix" className="form-control" />
          </fieldset>
        </div>
      </div>

      <div className="d-flex mt-2 gap-3">
        <button type="submit" disabled={isSubmitting} className="btn btn-primary">
          Generate
        </button>
        <button type="button" disabled={isSubmitting} onClick={onCancel} className="btn btn-danger">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default GenerateRecordConfigsForm;
