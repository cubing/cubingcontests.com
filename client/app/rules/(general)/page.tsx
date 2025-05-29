import Markdown from "react-markdown";
import Tabs from "~/app/components/UI/Tabs.tsx";
import { tabs } from "../tabs.ts";
import rules from "./general-rules.md";

const GeneralRulesPage = () => {
  return (
    <>
      <Tabs activeTab="general" tabs={tabs} forServerSidePage prefetch />

      <div className="px-3 lh-lg">
        <Markdown>{rules}</Markdown>
      </div>
    </>
  );
};

export default GeneralRulesPage;
