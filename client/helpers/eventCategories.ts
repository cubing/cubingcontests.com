import { EventGroup } from '@sh/enums';
import C from '~/shared_helpers/constants';

const contactMsg = `Contact ${C.contactEmail} if you would like to submit a result.`;

export const eventCategories = [
  {
    title: 'WCA',
    value: 'wca',
    group: EventGroup.WCA,
    description: `This is based on results from speedcuber meetups. 4x4-5x5 Blindfolded and Multi-Blind also allow submitted results with video evidence. ${contactMsg}`,
  },
  {
    title: 'Unofficial',
    value: 'unofficial',
    group: EventGroup.Unofficial,
    description: `These events can be held at WCA competitions (unofficially) and at speedcuber meetups. Team relay events also allow submitted results with video evidence. ${contactMsg}`,
  },
  {
    title: 'Extreme BLD',
    value: 'extremebld',
    group: EventGroup.ExtremeBLD,
    description: `These events are submission-only and require video evidence. ${contactMsg}`,
  },
  {
    title: 'Removed',
    value: 'removed',
    group: EventGroup.Removed,
    description:
      'These events have been removed and will no longer be hosted on Cubing Contests. Team-Blind Old Style is the old format that had inspection time.',
  },
];
