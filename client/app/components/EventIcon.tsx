import "@cubing/icons";
import { CubingIcons } from "@cubing/icons/js";
import { shortenEventName } from "~/helpers/utility-functions.ts";
import type { EventResponse } from "~/server/db/schema/events.ts";

type Props = {
  event: Pick<EventResponse, "eventId" | "name">;
  onClick?: () => void;
  isActive?: boolean;
};

function EventIcon({ event, onClick, isActive }: Props) {
  const iconCode = Object.values(CubingIcons).find((icon) =>
    [`event-${event.eventId}`, `unofficial-${event.eventId}`].includes(icon),
  );

  if (!iconCode) {
    if (!onClick) return undefined;

    return (
      <button type="button" onClick={onClick} className={`btn btn-lightdark btn-sm m-1 ${isActive ? "active" : ""}`}>
        {shortenEventName(event.name)}
      </button>
    );
  }

  const iconElement = <span className={`cubing-icon ${iconCode}`} title={event.name} />;

  if (!onClick) return iconElement;

  return (
    <button type="button" onClick={onClick} className={`rr-icon-button ${isActive ? "rr-icon-button--active" : ""}`}>
      {iconElement}
    </button>
  );
}

export default EventIcon;
