import Link from 'next/link';

export default function Home() {
  return (
    <div className="px-3">
      <h1 className="mb-3 mb-lg-4 text-center">Cubing Contests</h1>
      <p>
        This is a place for posting results from unofficial Rubik&apos;s cube competitions, unofficial events held at
        WCA competitions, speedcuber meetups, and other unofficial events. All official WCA events are supported, as
        well as unofficial events, and additional ones can be added, including team events. Records are also tracked for
        all events.
      </p>
      <p>
        The events are split up into multiple groups: WCA, Unofficial, and Remote. Remote events are not meant to be
        done in a competition-like setting, but instead need to be submitted individually, similar to how speedrun
        rankings work.
      </p>
      <div className="my-4 d-flex flex-wrap justify-content-center gap-2 gap-lg-5">
        <Link href="/competitions" className="d-block mb-2 fs-5">
          <button type="button" className="btn btn-primary">
            See all contests
          </button>
        </Link>
        <Link href="/records" className="fs-5">
          <button type="button" className="btn btn-primary">
            See current records
          </button>
        </Link>
      </div>
      <p>
        If you would like to create an unofficial competition or meetup, host unofficial events for a WCA competition,
        or submit individual results for a remote event, please send an inquiry to cube327@tuta.io
      </p>
    </div>
  );
}
