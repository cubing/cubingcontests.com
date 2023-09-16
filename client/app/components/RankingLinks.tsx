import { IRanking } from '@sh/interfaces';

const RankingLinks = ({ ranking }: { ranking: IRanking }) => {
  return (
    <div className="d-flex gap-2">
      {ranking.videoLink ? (
        <a href={ranking.videoLink} target="_blank">
          Video
        </a>
      ) : (
        'Video unavailable'
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
