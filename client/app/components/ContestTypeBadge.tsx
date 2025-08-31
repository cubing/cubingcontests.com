import { Color, ContestType } from "~/helpers/enums.ts";
import { contestTypeOptions } from "~/helpers/multipleChoiceOptions.ts";
import type { MultiChoiceOption } from "~/helpers/types/MultiChoiceOption.ts";

type Props = {
  type: ContestType;
  brief?: boolean;
};

const ContestTypeBadge = ({ type, brief = false }: Props) => {
  const contestType = contestTypeOptions.find((el) => el.value === type) as MultiChoiceOption;
  const textClass: string = contestType.color === Color.White || contestType.color === Color.Yellow ? "text-black" : "";

  return (
    <div
      className={`badge ${textClass}`}
      style={{ padding: "0.4rem 0.5rem", backgroundColor: contestType.color }}
    >
      {brief ? contestType?.shortLabel || contestType?.label : contestType?.label}
    </div>
  );
};

export default ContestTypeBadge;
