"use client";

import { useContext } from "react";
import { MainContext } from "~/helpers/contexts.ts";

type Props = { small?: boolean; dontCenter?: boolean };

const Loading = ({ small, dontCenter }: Props) => {
  const { errorMessages } = useContext(MainContext);

  if (errorMessages.length > 0 && !small) return <p className="mt-5 text-center fs-4">{errorMessages[0]}</p>;

  const height = small ? "1.3rem" : "4rem";
  const width = small ? "1.3rem" : "4rem";

  return (
    <div className={dontCenter ? "ms-2 d-inline" : "d-flex justify-content-center"} style={{ height }}>
      <div
        className="position-absolute spinner-border text-white fs-6"
        style={{ marginTop: small ? "0" : "5rem", width, height }}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

export default Loading;
