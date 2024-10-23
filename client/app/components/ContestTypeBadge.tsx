import { Color, ContestType } from "~/shared_helpers/enums.ts";
import { contestTypeOptions } from "~/helpers/multipleChoiceOptions.ts";
import { getBSClassFromColor } from "~/helpers/utilityFunctions.ts";

const ContestTypeBadge = (
  { type, brief = false }: { type: ContestType; brief?: boolean },
) => {
  const contestType = contestTypeOptions.find((el) => el.value === type);

  const getBlackTextClass = () => {
    return [Color.White, Color.Yellow].includes(contestType.color) ? "text-black" : "";
  };

  return (
    <div
      className={`badge bg-${getBSClassFromColor(contestType.color)} ${getBlackTextClass()}`}
      style={{ padding: "0.4rem 0.5rem" }}
    >
      {brief ? contestType?.shortLabel || contestType?.label : contestType?.label}
    </div>
  );
};

export default ContestTypeBadge;
