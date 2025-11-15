import { C } from "~/helpers/constants.ts";
import { contestTypeOptions } from "~/helpers/multipleChoiceOptions.ts";
import type { MultiChoiceOption } from "~/helpers/types/MultiChoiceOption.ts";
import type { ContestType } from "~/helpers/types.ts";

type Props = {
  type: ContestType;
  brief?: boolean;
};

const ContestTypeBadge = ({ type, brief = false }: Props) => {
  const contestType = contestTypeOptions.find((el) => el.value === type) as MultiChoiceOption;
  const textClass: string = contestType.color === C.color.warning ? "text-black" : "";

  return (
    <div className={`badge ${textClass}`} style={{ padding: "0.4rem 0.5rem", backgroundColor: contestType.color }}>
      {brief ? contestType?.shortLabel || contestType?.label : contestType?.label}
    </div>
  );
};

export default ContestTypeBadge;
