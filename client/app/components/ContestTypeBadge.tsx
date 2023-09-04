import { competitionTypeOptions } from '~/helpers/multipleChoiceOptions';
import { getBGClassFromColor } from '~/helpers/utilityFunctions';
import { CompetitionType } from '~/shared_helpers/enums';

const ContestTypeBadge = ({ type }: { type: CompetitionType }) => {
  const contestType = competitionTypeOptions.find((el) => el.value === type);

  return (
    <div className={'badge ' + getBGClassFromColor(contestType.color)} style={{ padding: '0.4rem 0.5rem' }}>
      {contestType?.label}
    </div>
  );
};

export default ContestTypeBadge;
