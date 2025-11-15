import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ne } from "drizzle-orm";
import Link from "next/link";
import CollectiveCubing from "~/app/components/CollectiveCubing.tsx";
import { db } from "~/server/db/provider.ts";
import {
  collectiveSolutionsPublicCols,
  collectiveSolutionsTable as csTable,
} from "../server/db/schema/collective-solutions.ts";
import PartialHomePageDetails from "./components/PartialHomePageDetails.tsx";

async function HomePage() {
  const [collectiveSolution] = await db
    .select(collectiveSolutionsPublicCols)
    .from(csTable)
    .where(ne(csTable.state, "archived"))
    .limit(1);

  return (
    <div className="px-3">
      <h1 className="mb-4 text-center">Cubing Contests</h1>

      <div className="alert alert-light mb-4" role="alert">
        Join the Cubing Contests{" "}
        <a href="https://discord.gg/7rRMQA8jnU" target="_blank" rel="noopener noreferrer">
          Discord server
        </a>
        !
      </div>

      <p>
        This is a place for hosting unofficial Rubik's Cube competitions, unofficial events held at{" "}
        <a href="https://www.worldcubeassociation.org/" target="_blank" rel="noopener">
          WCA
        </a>{" "}
        competitions, speedcuber meetups, and other unofficial events.
      </p>
      <p>
        The events are split up into multiple categories: Unofficial, WCA, Extreme BLD, and Miscellaneous. Extreme BLD
        events are not meant to be done in a competition-like setting, but instead need to be submitted individually
        with video evidence. Some other events also allow submitted results.
      </p>

      <div className="my-4 d-flex flex-column flex-md-row justify-content-center align-items-center gap-3 gap-lg-4 fs-5">
        <Link href="/about" className="cc-homepage-link btn btn-primary">
          About Us
        </Link>
        <Link href="/competitions" prefetch={false} className="cc-homepage-link btn btn-primary">
          See All Contests
        </Link>
        <Link href="/records" prefetch={false} className="cc-homepage-link btn btn-primary">
          See Current Records
        </Link>
        <Link href="/rankings" prefetch={false} className="cc-homepage-link btn btn-primary">
          See Rankings
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
        held as an official{" "}
        <a href="https://www.worldcubeassociation.org/" target="_blank" rel="noopener">
          WCA
        </a>{" "}
        competition.
      </div>
      <Link href="/moderator-instructions" className="btn btn-secondary mt-4">
        Moderator Instructions
      </Link>

      <PartialHomePageDetails />

      <h3 className="cc-basic-heading">Collective Cubing</h3>

      <CollectiveCubing initCollectiveSolution={collectiveSolution ?? null} />
    </div>
  );
}

export default HomePage;
