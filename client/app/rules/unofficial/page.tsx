import Markdown from "react-markdown";
import Tabs from "~/app/components/UI/Tabs.tsx";
import { tabs } from "../tabs.ts";
import rules from "./unofficial-comp-rules.md";

const UnofficialCompRulesPage = () => {
  return (
    <>
      <Tabs activeTab="unofficial" tabs={tabs} forServerSidePage prefetch />

      <Markdown className="px-3 lh-lg">{rules}</Markdown>
    </>
  );
};

export default UnofficialCompRulesPage;
