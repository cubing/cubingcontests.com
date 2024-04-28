import Competitor from '@c/Competitor';
import { IFeUser } from '@sh/types';

const CreatorDetails = ({ creator }: { creator: IFeUser }) => {
  if (creator) {
    return creator.person ? (
      <>
        <Competitor person={creator.person} />
        <span>(username: {creator.username})</span>
      </>
    ) : (
      <span>{creator.username}</span>
    );
  }

  return <span>DELETED USER</span>;
};

export default CreatorDetails;
