import Competitor from '@c/Competitor';
import { IFeUser } from '@sh/types';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';

const CreatorDetails = ({
  creator,
  small,
  loggedInUser,
}: {
  creator: IFeUser | 'EXT_DEVICE';
  small?: boolean;
  loggedInUser?: IUserInfo;
}) => {
  let specialCase: string;
  if (!creator) specialCase = 'Deleted user';
  else if (creator === 'EXT_DEVICE') specialCase = 'External device';
  else if (loggedInUser && creator.username === loggedInUser.username) specialCase = 'Me';

  if (specialCase)
    return small ? <span>{specialCase}</span> : <div className="mb-3">Created by:&#8194;{specialCase}</div>;

  creator = creator as IFeUser;
  const username = <a href={`mailto:${creator.email}`}>{creator.username}</a>;
  const competitor =
    creator.person !== null ? (
      <Competitor person={creator.person} noFlag />
    ) : (
      <span className="text-danger fw-bold">NOT FOUND</span>
    );

  if (small) {
    return (
      <span className="d-flex flex-wrap align-items-center column-gap-2">
        {competitor}
        <span>({username})</span>
      </span>
    );
  }

  return (
    <div className="d-flex flex-wrap align-items-center column-gap-2 mb-3">
      <span>Created by:</span>

      {creator.person ? (
        <>
          {competitor}
          <span>(user: {username})</span>
        </>
      ) : (
        <span>{username}</span>
      )}
    </div>
  );
};

export default CreatorDetails;
