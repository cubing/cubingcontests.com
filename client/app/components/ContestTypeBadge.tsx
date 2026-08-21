import { C } from "~/helpers/constants.ts";
import { contestTypeOptions } from "~/helpers/multipleChoiceOptions.ts";
import type { ContestType } from "~/helpers/types.ts";

type Props = {
  type: ContestType;
  display?: "default" | "short" | "icon";
};

function ContestTypeBadge({ type, display = "default" }: Props) {
  const contestType = contestTypeOptions.find((ct) => ct.value === type)!;

  if (display === "icon") {
    return (
      <div
        className={`tw:shrink-0 tw:text-xs ${type === "comp" ? "tw:icon-[tabler--square-filled]" : type === "meetup" ? "tw:icon-[tabler--flare-filled] tw:text-sm!" : type === "online" ? "tw:icon-[tabler--triangle-filled]" : "tw:icon-[tabler--circle-filled]"}`}
        style={{ color: contestType?.color }}
        title={contestType?.label}
      />
    );
  }

  return (
    <div
      className={`badge ${contestType.color === C.color.warning ? "text-black" : ""}`}
      style={{ padding: "0.4rem 0.5rem", backgroundColor: contestType.color }}
    >
      {display === "short" ? contestType.shortLabel || contestType.label : contestType.label}
    </div>
  );
}

export default ContestTypeBadge;
