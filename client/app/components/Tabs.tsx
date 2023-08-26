const Tabs = ({
  titles,
  activeTab,
  setActiveTab,
}: {
  titles: string[];
  activeTab: number; // the first tab is 0
  setActiveTab: (value: number) => void;
}) => {
  return (
    <ul className="mb-3 nav nav-tabs">
      {titles.map((title, index) => (
        <li key={index} className="me-2 nav-item">
          <button
            type="button"
            className={'nav-link' + (activeTab === index ? ' active' : '')}
            onClick={() => setActiveTab(index)}
          >
            {title}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default Tabs;
