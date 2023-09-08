import { IAttempt, IEvent } from '@sh/interfaces';
import { getFormattedTime } from '~/helpers/utilityFunctions';

const Solves = ({ event, attempts }: { event: IEvent; attempts: IAttempt[] }) => {
  return (
    <div className="d-flex gap-2">
      {attempts.map((attempt, index) => (
        <span key={index}>{getFormattedTime(attempt.result, event.format)}</span>
      ))}
    </div>
  );
};

export default Solves;
