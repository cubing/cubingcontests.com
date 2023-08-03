const Tabs = ({
  titles,
  activeTab,
  setActiveTab,
}: {
  titles: string[];
  activeTab: number;
  setActiveTab: (value: number) => void;
}) => {
  return (
    <ul className="mb-3 nav nav-tabs">
      {titles.map((title, index) => (
        <li key={index} className="me-2 nav-item">
          <button
            type="button"
            className={'nav-link' + (activeTab === index + 1 ? ' active' : '')}
            onClick={() => setActiveTab(index + 1)}
          >
            {title}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default Tabs;
