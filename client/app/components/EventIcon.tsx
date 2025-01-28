import "@cubing/icons";
import { CubingIcons } from "@cubing/icons/js";
import { Event, EventGroup } from "@cc/shared";
import { shortenEventName } from "~/helpers/utilityFunctions.ts";

type Props = {
  event: Event;
  onClick?: () => void;
  isActive?: boolean;
};

const EventIcon = ({ event, onClick, isActive }: Props) => {
  const isOrWasWCAEvent = event.groups.includes(EventGroup.WCA) || event.groups.includes(EventGroup.RemovedWCA);
  const availableIcons = Object.values(CubingIcons).map((iconId) =>
    (iconId as string).replace("event-", "").replace("unofficial-", "")
  );
  const iconExists = isOrWasWCAEvent || availableIcons.includes(event.eventId);

  if (!iconExists) {
    if (!onClick) return <></>;

    return (
      <button type="button" onClick={onClick} className={"btn btn-lightdark btn-sm m-1" + (isActive ? " active" : "")}>
        {shortenEventName(event.name)}
      </button>
    );
  }

  if (!onClick) return <span className={`cubing-icon ${isOrWasWCAEvent ? "event" : "unofficial"}-${event.eventId}`} />;

  return (
    <button onClick={onClick} className={"cc-icon-button" + (isActive ? " cc-icon-button--active" : "")}>
      <span className={`cubing-icon ${isOrWasWCAEvent ? "event" : "unofficial"}-${event.eventId}`} />
    </button>
  );
};

export default EventIcon;
