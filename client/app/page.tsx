import Link from 'next/link';

export default function Home() {
  return (
    <div className="px-3">
      <h1 className="mb-5 text-center">Cubing Contests</h1>
      <p className="fs-5">
        This is a place for hosting unofficial Rubik&apos;s cube competitions or meetups. All official WCA events are
        supported, and new ones can be created too, including team events. Records are also tracked for all events.
      </p>
      <Link href="/competitions" className="d-block mb-3 fs-5">
        See all contests
      </Link>
      <Link href="/records" className="fs-5">
        See current records
      </Link>
    </div>
  );
}
