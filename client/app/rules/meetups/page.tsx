import Markdown from "react-markdown";
import Tabs from "~/app/components/UI/Tabs.tsx";
import { tabs } from "../tabs.ts";
import rules from "./meetup-rules.md";

const MeetupRulesPage = () => {
  return (
    <>
      <Tabs activeTab="meetups" tabs={tabs} forServerSidePage prefetch />

      <Markdown className="px-3 lh-lg">{rules}</Markdown>
    </>
  );
};

export default MeetupRulesPage;
