import Link from "next/link";
import { slugPath } from "~/helpers/utility-functions.ts";

type Props = {
  slug: string;
  showBillingTodo: boolean;
  showLinkPersonTodo: boolean;
  showAddEventsTodo: boolean;
  showCreateContestTodo: boolean;
};

function SpaceTodoList({ slug, showBillingTodo, showLinkPersonTodo, showAddEventsTodo, showCreateContestTodo }: Props) {
  return (
    <div className="mb-4">
      <h4 className="mb-3">Getting started to-do:</h4>

      <ul className="list-unstyled">
        <SpaceTodoItem checked={!showBillingTodo}>
          Start your free trial on the <Link href={slugPath(slug, "/billing")}>Billing</Link> page
        </SpaceTodoItem>
        <SpaceTodoItem checked={!showLinkPersonTodo}>
          Create a person profile on the <Link href={slugPath(slug, "/mod/competitors")}>Manage competitors</Link> page
          and then link it to your member profile on the{" "}
          <Link href={slugPath(slug, "/mod/members")}>Manage members</Link> page
        </SpaceTodoItem>
        <SpaceTodoItem checked={!showAddEventsTodo}>
          Set up the list of events for this space using the{" "}
          <Link href={slugPath(slug, "/mod/events")}>Configure events</Link> page
        </SpaceTodoItem>
        <SpaceTodoItem checked={!showCreateContestTodo}>
          Create your first contest on the <Link href={slugPath(slug, "/mod/competition")}>Create new contest</Link>{" "}
          page
        </SpaceTodoItem>
      </ul>
    </div>
  );
}

type SpaceTodoItemProps = {
  checked: boolean;
  children: React.ReactNode;
};

function SpaceTodoItem({ checked, children }: SpaceTodoItemProps) {
  return (
    <li className="tw:mb-2">
      <div className="tw:flex tw:items-center tw:gap-2">
        {checked ? (
          <span className="tw:icon-[tabler--checkbox] tw:text-amber-500 tw:text-xl" />
        ) : (
          <span className="tw:icon-[tabler--square] tw:ms-px tw:text-lg" />
        )}
        <span className={checked ? "text-muted tw:line-through" : ""}>{children}</span>
      </div>
    </li>
  );
}

export default SpaceTodoList;
