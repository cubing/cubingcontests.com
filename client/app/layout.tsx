import 'bootstrap/dist/css/bootstrap.css';
import '@/globals.css';

import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Cubing Contests',
  description: 'A place for posting results from Rubik\'s cube meetups.',
  keywords: 'rubik\'s cube contest contests competition speedcubing cubing puzzle',
};

export default function RootLayout({ children, }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body data-bs-theme="dark" className="min-vh-100 d-flex flex-column">
        <nav className="navbar navbar-expand-lg bg-body-tertiary">
          <Navbar />
        </nav>
        <main className="container-md d-flex flex-column pt-4 px-0 flex-grow-1">{children}</main>
      </body>
    </html>
  );
}
