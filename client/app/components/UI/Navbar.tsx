"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { authClient } from "~/helpers/authClient.ts";

type Props = {
  initSession: typeof authClient.$Infer.Session | null;
};

const NavbarItems = ({ initSession }: Props) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [expanded, setExpanded] = useState(false);
  const [resultsExpanded, setResultsExpanded] = useState(false);
  const [userExpanded, setUserExpanded] = useState(false);
  const [canAccessModDashboard, setCanAccessModDashboard] = useState(false);

  const user = isPending ? initSession?.user : session?.user;

  useEffect(() => {
    if (user) {
      authClient.admin.hasPermission({ permissions: { modDashboard: ["view"] } }).then(({ data }) => {
        if (data) setCanAccessModDashboard(data.success);
      });
    }
  }, [session]);

  const logOut = async () => {
    collapseAll();
    await authClient.signOut();
    router.push("/");
  };

  const toggleDropdown = (
    dropdown: "results" | "user",
    newValue = !resultsExpanded,
  ) => {
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
        <Link className="navbar-brand" href="/">
          <Image src="/favicon.png" height={45} width={45} alt="Home" />
        </Link>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="cc-icon-button d-lg-none"
          aria-label="Menu button"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <div
          className={"navbar-collapse justify-content-end" +
            (expanded ? "" : " collapse")}
        >
          <ul className="navbar-nav align-items-start align-items-lg-end gap-lg-4 mt-3 mt-lg-0 mx-2 fs-5">
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
              <ul
                className={`dropdown-menu py-0 px-3 px-lg-2 ${resultsExpanded ? "show" : ""}`}
              >
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
            {!user
              ? (
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    href="/login"
                    onClick={collapseAll}
                  >
                    Log In
                  </Link>
                </li>
              )
              : (
                <li
                  className="nav-item dropdown"
                  onMouseEnter={() => toggleDropdown("user", true)}
                  onMouseLeave={() => toggleDropdown("user", false)}
                >
                  <button
                    type="button"
                    onClick={() => toggleDropdown("user")}
                    className="nav-link dropdown-toggle"
                  >
                    {user.username}
                  </button>
                  <ul
                    className={`dropdown-menu end-0 py-0 px-3 px-lg-2 ${userExpanded ? "show" : ""}`}
                  >
                    {canAccessModDashboard && (
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
                      <Link
                        className="nav-link"
                        href="/user/submit-results"
                        onClick={collapseAll}
                      >
                        Submit Results
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="nav-link"
                        href="/user/settings"
                        onClick={collapseAll}
                      >
                        Settings
                      </Link>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={logOut}
                        className="nav-link"
                      >
                        Log Out
                      </button>
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
