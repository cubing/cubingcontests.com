import { IAttempt, IEvent } from '~/shared_helpers/types.ts';
import { getFormattedTime } from '~/shared_helpers/sharedFunctions.ts';

const Solves = ({
  event,
  attempts,
  showMultiPoints = false,
}: {
  event: IEvent;
  attempts: IAttempt[];
  showMultiPoints?: boolean;
}) => {
  return (
    <div className='d-flex gap-2'>
      {attempts.map((attempt, index) => (
        <span key={index}>
          {getFormattedTime(attempt.result, { event, showMultiPoints })}
        </span>
      ))}
    </div>
  );
};

export default Solves;
