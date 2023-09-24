import { contestTypeOptions } from '~/helpers/multipleChoiceOptions';
import { getBGClassFromColor } from '~/helpers/utilityFunctions';
import { ContestType } from '~/shared_helpers/enums';

const ContestTypeBadge = ({ type }: { type: ContestType }) => {
  const contestType = contestTypeOptions.find((el) => el.value === type);

  return (
    <div className={`badge ` + getBGClassFromColor(contestType.color)} style={{ padding: `0.4rem 0.5rem` }}>
      {contestType?.label}
    </div>
  );
};

export default ContestTypeBadge;
