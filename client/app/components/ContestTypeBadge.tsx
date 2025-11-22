import { C } from "~/helpers/constants.ts";
import { contestTypeOptions } from "~/helpers/multipleChoiceOptions.ts";
import type { ContestType } from "~/helpers/types.ts";

type Props = {
  type: ContestType;
  short?: boolean;
};

const ContestTypeBadge = ({ type, short = false }: Props) => {
  const contestType = contestTypeOptions.find((ct) => ct.value === type)!;

  return (
    <div
      className={`badge ${contestType.color === C.color.warning ? "text-black" : ""}`}
      style={{ padding: "0.4rem 0.5rem", backgroundColor: contestType.color }}
    >
      {short ? contestType.shortLabel || contestType.label : contestType.label}
    </div>
  );
};

export default ContestTypeBadge;
