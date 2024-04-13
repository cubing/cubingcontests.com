'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FaBars } from 'react-icons/fa';
import { getUserInfo } from '~/helpers/utilityFunctions';
import { IUserInfo } from '~/helpers/interfaces/UserInfo';
// import { ISearchResult } from '~/helpers/interfaces';

const NavbarItems = () => {
  const pathname = usePathname();

  const [userInfo, setUserInfo] = useState<IUserInfo>();
  const [expanded, setExpanded] = useState(false);
  const [resultsExpanded, setResultsExpanded] = useState(false);
  const [userExpanded, setUserExpanded] = useState(false);
  // const [searchTerm, setSearchTerm] = useState<string>('');
  // const [searchResults, setSearchResults] = useState<ISearchResult[]>([...]);

  // This is done to avoid the hydration error on SSR pages
  useEffect(() => setUserInfo(getUserInfo()), [getUserInfo]);

  // useEffect(() => {
  //   const fetchSearchResults = async () => {
  //     // const res = await fetch('http://localhost:5000/api/contests', {
  //     //   next: { revalidate: 0 },
  //     // });
  //     // const json = await res.json();
  //     // return json.contestsInfo;
  //     await new Promise((resolve) => setTimeout(resolve, 500));
  //     setSearchResults((prevSearchResults) => {
  //       prevSearchResults.pop();
  //       return prevSearchResults;
  //     });
  //   };

  //   fetchSearchResults();
  // }, [searchTerm]);

  const logOut = () => {
    collapseAll();
    localStorage.removeItem('jwtToken');
    window.location.href = '/';
  };

  const toggleDropdown = (dropdown: 'results' | 'user', newValue = !resultsExpanded) => {
    if (dropdown === 'results') {
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
    <div className="container-md position-relative">
      <Link className="navbar-brand fs-3" href="/">
        Cubing Contests
      </Link>
      <button className="cc-icon-button d-lg-none" onClick={() => setExpanded(!expanded)} type="button">
        <FaBars />
      </button>
      <div className={'navbar-collapse justify-content-end' + (expanded ? '' : ' collapse')}>
        <ul className="navbar-nav align-items-start align-items-lg-end gap-lg-4 mt-3 mt-lg-0 mx-2 fs-5">
          <li className="nav-item">
            <Link className={`nav-link ${pathname === '/' ? ' active' : ''}`} href="/" onClick={collapseAll}>
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className={`nav-link ${pathname === '/competitions' ? ' active' : ''}`}
              prefetch={false}
              href="/competitions"
              onClick={collapseAll}
            >
              Contests
            </Link>
          </li>
          <li
            className="nav-item dropdown"
            onMouseEnter={() => toggleDropdown('results', true)}
            onMouseLeave={() => toggleDropdown('results', false)}
          >
            <button
              type="button"
              className={`nav-link dropdown-toggle ${/^\/(rankings|records)\//.test(pathname) ? 'active' : ''}`}
              onClick={() => toggleDropdown('results')}
            >
              Results
            </button>
            <ul className={`dropdown-menu py-0 px-3 px-lg-2 ${resultsExpanded ? 'show' : ''}`}>
              <li>
                <Link
                  className={`nav-link ${/^\/records\//.test(pathname) ? ' active' : ''}`}
                  href="/records"
                  prefetch={false}
                  onClick={collapseAll}
                >
                  Records
                </Link>
              </li>
              <li>
                <Link
                  className={`nav-link ${/^\/rankings\//.test(pathname) ? ' active' : ''}`}
                  href="/rankings"
                  prefetch={false}
                  onClick={collapseAll}
                >
                  Rankings
                </Link>
              </li>
            </ul>
          </li>
          {!userInfo ? (
            <li className="nav-item">
              <Link className="nav-link" href="/login" onClick={collapseAll}>
                Log In
              </Link>
            </li>
          ) : (
            <li
              className="nav-item dropdown"
              onMouseEnter={() => toggleDropdown('user', true)}
              onMouseLeave={() => toggleDropdown('user', false)}
            >
              <button type="button" className="nav-link dropdown-toggle" onClick={() => toggleDropdown('user')}>
                {userInfo.username}
              </button>
              <ul className={`dropdown-menu py-0 px-3 px-lg-2 ${userExpanded ? 'show' : ''}`}>
                {userInfo.isMod && (
                  <li>
                    <Link className="nav-link" href="/mod" onClick={collapseAll}>
                      Mod Dashboard
                    </Link>
                  </li>
                )}
                <li>
                  <Link className="nav-link" href="/user/submit-results" onClick={collapseAll}>
                    Submit Results
                  </Link>
                </li>
                <li>
                  <Link className="nav-link" href="/user/settings" onClick={collapseAll}>
                    Settings
                  </Link>
                </li>
                <li>
                  <button type="button" className="nav-link" onClick={logOut}>
                    Log Out
                  </button>
                </li>
              </ul>
            </li>
          )}
        </ul>
        {/* <form className="d-flex mt-3 ms-0 mt-lg-0 ms-lg-4" role="search">
          <input
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control fs-5"
            type="search"
            placeholder="Search"
            aria-label="Search"
          />
        </form> */}
      </div>
      {/* {searchResults.length > 0 && searchTerm !== '' && (
        <div className="position-absolute bottom-0 end-0 dropdown">
          <ul className="position-absolute top-0 end-0 mt-3 me-2 dropdown-menu show">
            {searchResults.map((result) => (
              <li key={result.url}>
                <Link href={result.url} className="py-3 dropdown-item">
                  {result.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )} */}
    </div>
  );
};

export default NavbarItems;
