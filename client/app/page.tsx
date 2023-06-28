import Link from 'next/link';

export default function Home() {
  return (
    <div className="px-3">
      <h1 className="mb-5 text-center">Contest Results</h1>
      <p className="fs-5">This is a place for posting results from Rubik&apos;s cube meetups.</p>
      <Link href="/competitions" className="fs-5">
        See all contests
      </Link>
    </div>
  );
}
