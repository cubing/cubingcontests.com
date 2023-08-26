'use client';

import Tabs from './Tabs';
import { IEventRecords } from '@sh/interfaces';
import { recordsCategories } from '~/helpers/recordsCategories';

const RecordsCategoryTabs = ({ eventRecords, category }: { eventRecords: IEventRecords[]; category: string }) => {
  const filteredCategories = recordsCategories.filter((cat) =>
    eventRecords.some((el) => el.event.groups.includes(cat.group)),
  );

  const changeRecordsCategory = (newActiveTab: number) => {
    window.location.href = `/records/${filteredCategories[newActiveTab].value}`;
  };

  const titles = filteredCategories.map((el) => el.title);
  const activeTab = filteredCategories.findIndex((el) => el.value === category);

  return <Tabs titles={titles} activeTab={activeTab} setActiveTab={changeRecordsCategory} />;
};

export default RecordsCategoryTabs;
