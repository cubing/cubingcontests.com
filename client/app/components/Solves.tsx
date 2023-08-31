import { IEvent } from '@sh/interfaces';
import { formatTime } from '~/helpers/utilityFunctions';

const Solves = ({ event, attempts }: { event: IEvent; attempts: number[] }) => {
  return (
    <div className="d-flex gap-2">
      {attempts.map((attempt, index) => (
        <span key={index}>{formatTime(attempt, event)}</span>
      ))}
    </div>
  );
};

export default Solves;
