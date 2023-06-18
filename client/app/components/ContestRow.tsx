'use client';
import Link from 'next/link';
import { IContestInfo, } from '@sh/WCIF';
import IDate from '@sh/interfaces/Date';

const getFormattedDate = (date: IDate): string => {
  if (!date) return '';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',];

  return `${months[date.month - 1]} ${date.day}, ${date.year}`;
};

const redirectToContest = (contestID: string) => {
  window.location.href = '/contests/' + contestID;
};

const ContestRow = ({ contest, }: { contest: IContestInfo }) => {
  return (
    <tr onClick={() => redirectToContest(contest.id)}>
      <td>{getFormattedDate(contest.date)}</td>
      <td>
        <Link href="/" className="link-primary">
          {contest.name}
        </Link>
      </td>
      <td>{contest.location}</td>
      <td>{contest.participants}</td>
      <td>{contest.events}</td>
    </tr>
  );
};

export default ContestRow;
