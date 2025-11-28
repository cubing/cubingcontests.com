import Link from "next/link";
import type { NavigationItem } from "~/helpers/types/NavigationItem.ts";

type Props = {
  tabs: NavigationItem[];
  activeTab: string; // the value of the currently active tab
  setActiveTab?: (val: string) => void; // not needed on a client-side-rendered page
  prefetch?: boolean;
  replace?: boolean;
  forServerSidePage?: boolean;
  disabledTabs?: string[];
};

const Tabs = ({
  tabs,
  activeTab,
  setActiveTab,
  prefetch = false,
  replace = false,
  forServerSidePage = false,
  disabledTabs = [],
}: Props) => {
  if (prefetch && !forServerSidePage) {
    throw new Error("The Tabs component only supports prefetch when forServerSidePage is true");
  }

  return (
    <ul className="nav nav-tabs mb-3">
      {tabs
        .filter((el) => !el.hidden)
        .map((tab) => (
          <li key={tab.value} className="nav-item me-2">
            {!forServerSidePage && setActiveTab ? (
              <button
                type="button"
                onClick={() => setActiveTab(tab.value)}
                disabled={disabledTabs.includes(tab.value)}
                className={`nav-link ${activeTab === tab.value ? "active" : ""}`}
              >
                <span className="d-none d-md-inline">{tab.title}</span>
                <span className="d-inline d-md-none">{tab.shortTitle || tab.title}</span>
              </button>
            ) : (
              <Link
                href={tab.route!}
                prefetch={prefetch}
                replace={replace}
                className={`nav-link ${activeTab === tab.value ? "active" : ""}`}
              >
                <span className="d-none d-md-inline">{tab.title}</span>
                <span className="d-inline d-md-none">{tab.shortTitle || tab.title}</span>
              </Link>
            )}
          </li>
        ))}
    </ul>
  );
};

export default Tabs;
