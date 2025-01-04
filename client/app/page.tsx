import Link from "next/link";
import { C } from "@cc/shared";
import CollectiveCubing from "~/app/components/CollectiveCubing.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

const Home = () => {
  return (
    <div className="px-3">
      <h1 className="mb-4 text-center">Cubing Contests</h1>

      <div className="alert alert-secondary mb-4" role="alert">
        We now have a Cubing Contests <a href="https://discord.gg/7rRMQA8jnU" target="_blank">Discord server</a>!
      </div>

      <p>
        This is a place for hosting unofficial Rubik's Cube competitions, unofficial events held at{" "}
        <a href="https://www.worldcubeassociation.org/" target="_blank">WCA</a>{" "}
        competitions, speedcuber meetups, and other unofficial events.
      </p>
      <p>
        The events are split up into multiple categories: Unofficial, WCA, Extreme BLD, and Miscellaneous. Extreme BLD
        events are not meant to be done in a competition-like setting, but instead need to be submitted individually
        with video evidence. Some other events also allow submitted results.
      </p>

      <div className="my-4 d-flex flex-column flex-md-row justify-content-center align-items-center gap-3 gap-lg-5 fs-5">
        <Link href="/competitions" prefetch={false} className="cc-homepage-link btn btn-primary">
          See all contests
        </Link>
        <Link href="/records" prefetch={false} className="cc-homepage-link btn btn-primary">
          See current records
        </Link>
        <Link href="/rankings" prefetch={false} className="cc-homepage-link btn btn-primary">
          See rankings
        </Link>
      </div>

      <h3 className="cc-basic-heading">Holding a contest</h3>
      <p>
        Cubing Contests is an open platform where anyone can hold their competitions and meetups. However, you must
        first be granted moderator access to be able to create new contests. If you would like to hold unofficial events
        at a WCA competition or create an unofficial competition or meetup, you must first read the moderator
        instructions.
      </p>
      <div className="mt-4 mx-3 p-3 border rounded-3 fw-bold">
        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
        Please note that an unofficial competition can only be hosted on Cubing Contests if it's infeasible for it to be
        held as an official <a href="https://www.worldcubeassociation.org/" target="_blank">WCA</a> competition.
      </div>
      <Link href="/moderator-instructions" className="btn btn-secondary mt-4">
        Moderator instructions
      </Link>

      <h3 className="cc-basic-heading">Supporting the project</h3>
      <p>
        Cubing Contests is fully free to use, open source, and has no ads. Community donations help with the ongoing
        development and maintenance of the project.
      </p>
      <Link href="/donate" className="btn btn-success mt-2">
        Donate
      </Link>

      <h3 className="cc-basic-heading">Contact</h3>
      <p>For general inquiries, send an email to {C.contactEmail}.</p>

      <h3 className="cc-basic-heading">Collective Cubing</h3>
      <CollectiveCubing />
    </div>
  );
};

export default Home;
