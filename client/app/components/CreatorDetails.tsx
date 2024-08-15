import Competitor from '@c/Competitor';
import { IFeUser } from '@sh/types';

const CreatorDetails = ({ creator, concise }: { creator: IFeUser; concise?: boolean }) => {
  if (creator) {
    const username = <a href={`mailto:${creator.email}`}>{creator.username}</a>;

    return creator.person ? (
      <>
        <Competitor person={creator.person} noFlag={concise} />
        <span className={concise ? 'ms-2' : ''}>
          ({concise ? '' : 'username: '}
          {username})
        </span>
      </>
    ) : (
      <span>{username}</span>
    );
  }

  return <span>DELETED USER</span>;
};

export default CreatorDetails;
