import { EventGroup } from '@sh/enums';
import C from '~/shared_helpers/constants';

export const eventCategories = [
  {
    title: 'WCA events',
    mobileTitle: 'WCA',
    value: 'wca',
    group: EventGroup.WCA,
    description:
      'Unofficial rankings for WCA events based on results from speedcuber meetups. 4x4-5x5 Blindfolded and Multi-Blind also allow submitted results with video proof.',
    recordsPageDescription: 'Unofficial records for WCA events based on results from speedcuber meetups',
  },
  { title: 'Unofficial', value: 'unofficial', group: EventGroup.Unofficial },
  {
    title: 'Remote',
    value: 'remote',
    group: EventGroup.SubmissionOnly,
    description: `These events are submission-only and require video proof. Contact ${C.contactEmail} if you would like to submit a result.`,
  },
  { title: 'Removed', value: 'removed', group: EventGroup.Removed },
];
