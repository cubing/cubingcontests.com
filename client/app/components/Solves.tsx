import { IAttempt, IEvent } from '@sh/interfaces';
import { getFormattedTime } from '@sh/sharedFunctions';

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
    <div className="d-flex gap-2">
      {attempts.map((attempt, index) => (
        <span key={index}>{getFormattedTime(attempt.result, { event, showMultiPoints })}</span>
      ))}
    </div>
  );
};

export default Solves;
