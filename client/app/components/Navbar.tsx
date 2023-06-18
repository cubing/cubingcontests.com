'use client';
import { useState, } from 'react';
import Link from 'next/link';
import { usePathname, } from 'next/navigation';
import { FaBars, } from 'react-icons/fa';

const NavbarItems = () => {
  const pathname = usePathname();

  const [mobileItemsOpen, setMobileItemsOpen,] = useState<boolean>(false);

  return (
    <div className="container-md">
      <Link className="navbar-brand fs-3" href="/">
        Contests
      </Link>
      <button className="cr-icon-button d-lg-none" onClick={() => setMobileItemsOpen((prev) => !prev)} type="button">
        <FaBars />
      </button>
      <div className={'navbar-collapse justify-content-end' + (mobileItemsOpen ? '' : ' collapse')}>
        <ul className="mt-3 mt-lg-0 navbar-nav align-items-end gap-lg-4 fs-5">
          <li className="nav-item">
            <Link className={'nav-link' + (pathname === '/' ? ' active' : '')} aria-current="page" href="/">
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link className={'nav-link' + (pathname === '/contests' ? ' active' : '')} href="/contests">
              Contests
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NavbarItems;
