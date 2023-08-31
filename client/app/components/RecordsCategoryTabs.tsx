'use client';

import Tabs from './Tabs';
import { IEventRecords } from '@sh/interfaces';
import { recordsCategories } from '~/helpers/recordsCategories';
import { EventGroup } from '~/shared_helpers/enums';

const RecordsCategoryTabs = ({ eventRecords, category }: { eventRecords: IEventRecords[]; category: string }) => {
  const filteredCategories = recordsCategories.filter(
    (cat) => cat.group !== EventGroup.Removed && eventRecords.some((el) => el.event.groups.includes(cat.group)),
  );

  const changeRecordsCategory = (newActiveTab: number) => {
    window.location.href = `/records/${filteredCategories[newActiveTab].value}`;
  };

  const titles = filteredCategories.map((el) => el.title);
  const mobileTitles = filteredCategories.map((el) => el.mobileTitle || el.title);
  const activeTab = filteredCategories.findIndex((el) => el.value === category);

  return (
    <>
      <div className="d-block d-lg-none">
        <Tabs titles={mobileTitles} activeTab={activeTab} setActiveTab={changeRecordsCategory} />
      </div>
      <div className="d-none d-lg-block">
        <Tabs titles={titles} activeTab={activeTab} setActiveTab={changeRecordsCategory} />
      </div>
    </>
  );
};

export default RecordsCategoryTabs;
