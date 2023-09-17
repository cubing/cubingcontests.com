import Link from 'next/link';
import { INavigationItem } from '~/helpers/interfaces/NavigationItem';

const Tabs = ({
  tabs,
  activeTab,
  setActiveTab,
  forServerSidePage = false,
}: {
  tabs: INavigationItem[];
  activeTab: string; // the value of the currently active tab
  setActiveTab?: (val: string) => void; // not needed on a client-side-rendered page
  forServerSidePage?: boolean;
}) => {
  return (
    <ul className="mb-3 nav nav-tabs">
      {tabs
        .filter((el) => !el.hidden)
        .map((tab) => (
          <li key={tab.value} className="me-2 nav-item">
            {!forServerSidePage ? (
              <button
                type="button"
                className={'nav-link' + (activeTab === tab.value ? ' active' : '')}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.title}
              </button>
            ) : (
              <Link href={tab.route} className={'nav-link' + (activeTab === tab.value ? ' active' : '')}>
                {tab.title}
              </Link>
            )}
          </li>
        ))}
    </ul>
  );
};

export default Tabs;
