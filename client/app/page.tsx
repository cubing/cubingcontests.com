import Link from 'next/link';
import C from '~/shared_helpers/constants';

export default function Home() {
  return (
    <div className="px-3">
      <h1 className="mb-3 mb-lg-4 text-center">Cubing Contests</h1>
      <p>
        This is a place for hosting unofficial Rubik&apos;s cube competitions, unofficial events held at WCA
        competitions, speedcuber meetups, and other unofficial events.
      </p>
      <p>
        The events are split up into multiple categories: WCA, Unofficial, Extreme BLD, and Miscellaneous. Extreme BLD
        events are not meant to be done in a competition-like setting, but instead need to be submitted individually
        with video evidence. Some other events also allow submitted results.
      </p>
      <div className="my-4 d-flex flex-column flex-md-row justify-content-center align-items-center gap-3 gap-lg-5 fs-5">
        <Link href="/competitions" className="cc-homepage-link">
          <button type="button" className="w-100 btn btn-primary">
            See all contests
          </button>
        </Link>
        <Link href="/records" className="cc-homepage-link">
          <button type="button" className="w-100 btn btn-primary">
            See current records
          </button>
        </Link>
        <Link href="/rankings" className="cc-homepage-link">
          <button type="button" className="w-100 btn btn-primary">
            See rankings
          </button>
        </Link>
      </div>
      <p>
        If you would like to host unofficial events for a WCA competition or create a meetup or unofficial competition,
        please send an inquiry to {C.contactEmail}.
      </p>
    </div>
  );
}
