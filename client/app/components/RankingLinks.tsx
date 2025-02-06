import { IRanking } from "~/helpers/types.ts";
import { C } from "~/helpers/constants.ts";

const RankingLinks = ({ ranking }: { ranking: IRanking }) => {
  return (
    <div className="d-flex gap-2">
      {ranking.videoLink ? <a href={ranking.videoLink} target="_blank">Video</a> : C.videoNoLongerAvailableMsg}
      {ranking.discussionLink && <a href={ranking.discussionLink} target="_blank">Discussion</a>}
    </div>
  );
};

export default RankingLinks;
