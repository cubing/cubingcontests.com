"use client";

import { useContext } from "react";
import { MainContext } from "~/helpers/contexts.ts";

type Props = { small?: boolean; dontCenter?: boolean };

function Loading({ small, dontCenter }: Props) {
  const { errorMessages } = useContext(MainContext);

  if (errorMessages.length > 0 && !small) return <p className="fs-4 mt-5 text-center">{errorMessages[0]}</p>;

  const height = small ? "1.3rem" : "4rem";
  const width = small ? "1.3rem" : "4rem";

  return (
    <div
      id="loading_spinner"
      className={dontCenter ? "d-inline ms-2" : "d-flex justify-content-center"}
      style={{ height, marginBlock: small ? "0" : "5rem" }}
    >
      <div className="position-absolute spinner-border fs-6 text-white" style={{ width, height }}>
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export default Loading;
