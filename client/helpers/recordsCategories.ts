import { EventGroup } from '@sh/enums';

export const recordsCategories = [
  { title: 'WCA events', mobileTitle: 'WCA', value: 'wca', group: EventGroup.WCA },
  { title: 'Unofficial', value: 'unofficial', group: EventGroup.Unofficial },
  { title: 'Remote', value: 'remote', group: EventGroup.SubmissionOnly },
  { title: 'Removed', value: 'removed', group: EventGroup.Removed },
];
