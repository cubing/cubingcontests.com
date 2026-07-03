"use client";

import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { kebabCase } from "lodash";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useContext } from "react";
import { remove as removeAccents } from "remove-accents";
import { C, IS_RR_INSTANCE } from "~/helpers/constants.ts";
import { MainContext } from "~/helpers/contexts.ts";
import { useFeaturesInfo, useSession } from "~/helpers/hooks.ts";
import { slugPath } from "~/helpers/utility-functions.ts";

function Footer() {
  const { slug }: { slug: string } = useParams();
  const { organization } = useSession();
  const { theme, setTheme } = useContext(MainContext);
  const { privacyPolicy } = useFeaturesInfo();

  return (
    <footer className="d-flex justify-content-center min-vw-100 fs-5 column-gap-2 column-gap-sm-3 container flex-wrap bg-body-tertiary py-3 text-center align-items-center">
      <div className="d-flex column-gap-1 flex-wrap align-items-center">
        {!IS_RR_INSTANCE && <span>Powered by</span>}
        <a
          href={`${C.recordRanksLink}?utm_source=rr${organization ? `&utm_campaign=${kebabCase(removeAccents(organization.name))}` : ""}`}
          target="_blank"
          rel="noopener"
          className="rr-button"
        >
          {theme === "light" ? (
            <Image src="/recordranks_logo_transparent_light.png" height={40} width={177} alt="RecordRanks" />
          ) : (
            <Image src="/recordranks_logo_transparent.png" height={40} width={177} alt="RecordRanks" />
          )}
        </a>
      </div>
      <a
        href={C.sourceCodeLink}
        target="_blank"
        rel="noopener"
        className="rr-button d-inline-flex justify-content-center align-items-center"
        style={{ width: "1.75rem", height: "1.75rem" }}
      >
        <svg
          width="98"
          height="96"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
          style={{ transform: "scale(0.25)" }}
        >
          <title>Github Logo</title>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
            fill={theme === "light" ? "#333" : "#fff"}
          />
        </svg>
      </a>
      {slug && (
        <Link href={slugPath(slug, "/about")} prefetch={false} className="rr-button text-light-emphasis">
          About
        </Link>
      )}
      {privacyPolicy !== "disabled" &&
        (privacyPolicy === "policy-contents" ? (
          <Link href="/privacy" target="_blank" prefetch={false} className="text-light-emphasis">
            Privacy
          </Link>
        ) : (
          <a href={privacyPolicy} target="_blank" rel="noopener" className="text-light-emphasis">
            Privacy
          </a>
        ))}
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className={`btn ${theme === "light" ? "btn-light" : "btn-dark"} rounded-circle px-2`}
      >
        <FontAwesomeIcon icon={theme === "light" ? faSun : faMoon} />
      </button>
    </footer>
  );
}

export default Footer;
