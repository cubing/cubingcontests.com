import Link from "next/link";
import { INavigationItem } from "~/helpers/types.ts";

const Tabs = ({
  tabs,
  activeTab,
  setActiveTab,
  prefetch,
  replace,
  forServerSidePage,
}: {
  tabs: INavigationItem[];
  activeTab: string; // the value of the currently active tab
  setActiveTab?: (val: string) => void; // not needed on a client-side-rendered page
  prefetch?: boolean;
  replace?: boolean;
  forServerSidePage?: boolean;
}) => {
  if (prefetch && !forServerSidePage) {
    throw new Error(
      "The Tabs component only supports prefetch when forServerSidePage is set",
    );
  }

  return (
    <ul className="mb-3 nav nav-tabs">
      {tabs
        .filter((el) => !el.hidden)
        .map((tab) => (
          <li key={tab.value} className="me-2 nav-item">
            {!forServerSidePage
              ? (
                <button
                  type="button"
                  className={"nav-link" +
                    (activeTab === tab.value ? " active" : "")}
                  onClick={() => setActiveTab(tab.value)}
                >
                  <span className="d-none d-md-inline">{tab.title}</span>
                  <span className="d-inline d-md-none">
                    {tab.shortTitle || tab.title}
                  </span>
                </button>
              )
              : (
                <Link
                  href={tab.route}
                  prefetch={prefetch}
                  replace={replace}
                  className={"nav-link" +
                    (activeTab === tab.value ? " active" : "")}
                >
                  <span className="d-none d-md-inline">{tab.title}</span>
                  <span className="d-inline d-md-none">
                    {tab.shortTitle || tab.title}
                  </span>
                </Link>
              )}
          </li>
        ))}
    </ul>
  );
};

export default Tabs;
