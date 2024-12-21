"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { getUserInfo, logOutUser } from "~/helpers/utilityFunctions.ts";
import { UserInfo } from "~/helpers/types.ts";

const NavbarItems = () => {
  const pathname = usePathname();

  const [userInfo, setUserInfo] = useState<UserInfo>();
  const [expanded, setExpanded] = useState(false);
  const [resultsExpanded, setResultsExpanded] = useState(false);
  const [userExpanded, setUserExpanded] = useState(false);

  // This is done to avoid the hydration error on SSR pages
  useEffect(() => setUserInfo(getUserInfo()), [getUserInfo]);

  const logOut = () => {
    collapseAll();
    logOutUser();
  };

  const toggleDropdown = (dropdown: "results" | "user", newValue = !resultsExpanded) => {
    if (dropdown === "results") {
      setResultsExpanded(newValue);
      setUserExpanded(false);
    } else {
      setUserExpanded(newValue);
      setResultsExpanded(false);
    }
  };

  const collapseAll = () => {
    setExpanded(false);
    setResultsExpanded(false);
    setUserExpanded(false);
  };

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary">
      <div className="container-md position-relative">
        <Link className="navbar-brand fs-3" href="/">Cubing Contests</Link>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="cc-icon-button d-lg-none"
          aria-label="Menu button"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <div className={"navbar-collapse justify-content-end" + (expanded ? "" : " collapse")}>
          <ul className="navbar-nav align-items-start align-items-lg-end gap-lg-4 mt-3 mt-lg-0 mx-2 fs-5">
            <li className="nav-item">
              <Link
                className={`nav-link ${pathname === "/" ? " active" : ""}`}
                href="/"
                onClick={collapseAll}
              >
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${pathname === "/competitions" ? " active" : ""}`}
                prefetch={false}
                href="/competitions"
                onClick={collapseAll}
              >
                Contests
              </Link>
            </li>
            <li
              className="nav-item dropdown"
              onMouseEnter={() => toggleDropdown("results", true)}
              onMouseLeave={() => toggleDropdown("results", false)}
            >
              <button
                type="button"
                className={`nav-link dropdown-toggle ${/^\/(rankings|records)\//.test(pathname) ? "active" : ""}`}
                onClick={() => toggleDropdown("results")}
              >
                Results
              </button>
              <ul className={`dropdown-menu py-0 px-3 px-lg-2 ${resultsExpanded ? "show" : ""}`}>
                <li>
                  <Link
                    className={`nav-link ${/^\/records\//.test(pathname) ? " active" : ""}`}
                    href="/records"
                    prefetch={false}
                    onClick={collapseAll}
                  >
                    Records
                  </Link>
                </li>
                <li>
                  <Link
                    className={`nav-link ${/^\/rankings\//.test(pathname) ? " active" : ""}`}
                    href="/rankings"
                    prefetch={false}
                    onClick={collapseAll}
                  >
                    Rankings
                  </Link>
                </li>
              </ul>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${pathname === "/rules" ? " active" : ""}`}
                href="/rules"
                onClick={collapseAll}
              >
                Rules
              </Link>
            </li>
            {!userInfo
              ? (
                <li className="nav-item">
                  <Link className="nav-link" href="/login" onClick={collapseAll}>Log In</Link>
                </li>
              )
              : (
                <li
                  className="nav-item dropdown"
                  onMouseEnter={() => toggleDropdown("user", true)}
                  onMouseLeave={() => toggleDropdown("user", false)}
                >
                  <button type="button" onClick={() => toggleDropdown("user")} className="nav-link dropdown-toggle">
                    {userInfo.username}
                  </button>
                  <ul
                    className={`dropdown-menu end-0 py-0 px-3 px-lg-2 ${userExpanded ? "show" : ""}`}
                  >
                    {userInfo.isMod && (
                      <li>
                        <Link
                          className="nav-link"
                          href="/mod"
                          onClick={collapseAll}
                        >
                          Mod Dashboard
                        </Link>
                      </li>
                    )}
                    <li>
                      <Link className="nav-link" href="/user/submit-results" onClick={collapseAll}>Submit Results</Link>
                    </li>
                    <li>
                      <Link className="nav-link" href="/user/settings" onClick={collapseAll}>Settings</Link>
                    </li>
                    <li>
                      <button type="button" onClick={logOut} className="nav-link">Log Out</button>
                    </li>
                  </ul>
                </li>
              )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavbarItems;
