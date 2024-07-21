import Competitor from '@c/Competitor';
import { IFeUser } from '@sh/types';

const CreatorDetails = ({ creator }: { creator: IFeUser }) => {
  if (creator) {
    const username = <a href={`mailto:${creator.email}`}>{creator.username}</a>;

    return creator.person ? (
      <>
        <Competitor person={creator.person} />
        <span>(username: {username})</span>
      </>
    ) : (
      <span>{username}</span>
    );
  }

  return <span>DELETED USER</span>;
};

export default CreatorDetails;
