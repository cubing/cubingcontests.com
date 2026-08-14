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
  const { aboutPageEnabled, privacyPolicy } = useFeaturesInfo();

  return (
    <footer className="d-flex justify-content-center min-vw-100 column-gap-2 column-gap-sm-3 container flex-wrap bg-body-tertiary py-3 text-center align-items-center">
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
      {IS_RR_INSTANCE && (
        <a
          href={C.rrDiscordServerLink}
          target="_blank"
          rel="noopener"
          title="Discord logo"
          className="rr-button d-inline-flex justify-content-center align-items-center"
        >
          <span className="tw:icon-[logos--discord-icon] tw:text-xl" />
        </a>
      )}
      <a
        href={C.sourceCodeLink}
        target="_blank"
        rel="noopener"
        title="GitHub logo"
        className="rr-button d-inline-flex justify-content-center align-items-center"
      >
        <span
          className={`tw:icon-[streamline-logos--github-logo-2-solid] tw:text-2xl ${theme === "dark" ? "tw:text-white" : "tw:text-black"}`}
        />
      </a>
      {slug && aboutPageEnabled && (
        <Link href={slugPath(slug, "/about")} prefetch={false} className="rr-button text-light-emphasis">
          About
        </Link>
      )}
      <a href={C.rrDocsLink} target="_blank" rel="noopener" className="rr-button text-light-emphasis">
        Docs
      </a>
      {privacyPolicy !== "disabled" &&
        (privacyPolicy === "policy-contents" ? (
          <Link href="/privacy" prefetch={false} className="rr-button text-light-emphasis">
            Privacy
          </Link>
        ) : (
          <a href={privacyPolicy} target="_blank" rel="noopener" className="rr-button text-light-emphasis">
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
