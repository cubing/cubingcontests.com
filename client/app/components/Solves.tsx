import { IEvent } from '@sh/interfaces';
import { getFormattedTime } from '~/helpers/utilityFunctions';

const Solves = ({ event, attempts }: { event: IEvent; attempts: number[] }) => {
  return (
    <div className="d-flex gap-2">
      {attempts.map((attempt, index) => (
        <span key={index}>{getFormattedTime(attempt, event.format)}</span>
      ))}
    </div>
  );
};

export default Solves;
