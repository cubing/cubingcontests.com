import capitalize from "lodash/capitalize";
import Link from "next/link";
import type { RecordCategory } from "~/helpers/types.ts";

type Props = {
  pathTemplate: string; // should include __CATEGORY__ that gets replaced by the new value
  selectedCategory: RecordCategory | "all";
  recordCategories: RecordCategory[];
  allCategoriesOption?: boolean;
  noTitle?: boolean;
};

function RecordCategoriesButtonGroup({
  pathTemplate,
  selectedCategory,
  recordCategories,
  allCategoriesOption,
  noTitle,
}: Props) {
  if (recordCategories.length < 2) return;

  const categories: (RecordCategory | "all")[] = [...recordCategories];
  if (allCategoriesOption) categories.push("all");

  return (
    <div>
      {!noTitle && <h5 className="mb-2">Category</h5>}
      {/* biome-ignore lint/a11y/useSemanticElements: this is the most suitable way to make a button group */}
      <div className="btn-group btn-group-sm" role="group" aria-label="Contest Type">
        {categories.map((rc) => (
          <Link
            key={rc}
            href={pathTemplate.replace("__CATEGORY__", rc)}
            prefetch={false}
            className={`btn btn-primary ${selectedCategory === rc ? "active" : ""}`}
          >
            {capitalize(rc)}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default RecordCategoriesButtonGroup;
