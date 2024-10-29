import { IRanking } from "~/shared_helpers/types.ts";

const RankingLinks = ({ ranking }: { ranking: IRanking }) => {
  return (
    <div className="d-flex gap-2">
      {ranking.videoLink
        ? (
          <a href={ranking.videoLink} target="_blank">
            Video
          </a>
        )
        : (
          "Video no longer available" // same text as on the submit results page
        )}
      {ranking.discussionLink && (
        <a href={ranking.discussionLink} target="_blank">
          Discussion
        </a>
      )}
    </div>
  );
};

export default RankingLinks;
