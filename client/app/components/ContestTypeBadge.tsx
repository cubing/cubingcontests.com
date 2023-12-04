import { Color, ContestType } from '@sh/enums';
import { contestTypeOptions } from '~/helpers/multipleChoiceOptions';
import { getBSClassFromColor } from '~/helpers/utilityFunctions';

const ContestTypeBadge = ({ type, brief = false }: { type: ContestType; brief?: boolean }) => {
  const contestType = contestTypeOptions.find((el) => el.value === type);

  const getBlackTextClass = () => {
    return [Color.White, Color.Yellow].includes(contestType.color) ? 'text-black' : '';
  };

  return (
    <div
      className={`badge bg-${getBSClassFromColor(contestType.color)} ${getBlackTextClass()}`}
      style={{ padding: '0.4rem 0.5rem' }}
    >
      {brief ? contestType?.shortLabel || contestType?.label : contestType?.label}
    </div>
  );
};

export default ContestTypeBadge;
