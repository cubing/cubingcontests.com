import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";

type Props = {
  isActive: boolean;
};

function ActiveInactiveIcon({ isActive }: Props) {
  return (
    <FontAwesomeIcon
      icon={isActive ? faCheck : faXmark}
      className={isActive ? "" : "text-danger"}
      style={{ height: "1.3rem" }}
    />
  );
}

export default ActiveInactiveIcon;
