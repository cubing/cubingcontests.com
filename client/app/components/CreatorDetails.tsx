import Competitor from '@c/Competitor';
import { IFrontendUser } from '@sh/interfaces';

const CreatorDetails = ({ creator }: { creator: IFrontendUser }) => {
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
