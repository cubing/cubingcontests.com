import { C } from "~/helpers/constants.ts";

type Props = {
  kofiGoalProgress: string;
  compact?: boolean;
};

function DonationGoals({ kofiGoalProgress, compact }: Props) {
  const progressValue = parseInt(kofiGoalProgress, 10);

  return (
    <>
      {compact ? (
        <a
          href={C.rrDonationLink}
          target="_blank"
          rel="noreferrer"
          className="link-body-emphasis link-underline-opacity-0 link-underline-opacity-100-hover d-block mb-2"
        >
          Ko-fi goal progress: <strong>Personal Records</strong>
        </a>
      ) : (
        <>
          <h4 className="mt-4">Goals</h4>
          <p>
            Prioritize RR feature: <strong>Personal Records</strong>
          </p>
        </>
      )}
      <div
        role="progressbar"
        className={`progress ${compact ? "mb-4" : "mb-2"}`}
        style={{ height: compact ? "1.1rem" : "1.3rem" }}
        aria-label="Goal progress"
        aria-valuenow={progressValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress-bar fs-6 fw-semibold bg-success" style={{ width: `${progressValue}%` }}>
          {progressValue}%
        </div>
      </div>
      {!compact && (
        <p className="mt-3">
          When this goal is reached, the Personal Records feature will be prioritized to be implemented into
          RecordRanks.
        </p>
      )}
    </>
  );
}

export default DonationGoals;
