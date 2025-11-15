import PartialHomePageDetails from "~/app/components/PartialHomePageDetails.tsx";

function AboutPage() {
  return (
    <section className="px-3 pb-4 lh-lg">
      <h2 className="mb-4 text-center">About</h2>

      {/* Largely copied from the home page */}
      <p>
        Cubing Contests is a place for hosting unofficial Rubik's Cube competitions, unofficial events held at WCA
        competitions, speedcuber meetups, and other unofficial events.
      </p>
      <p>
        The events are split up into multiple categories: Unofficial, WCA, Extreme BLD, and Miscellaneous. Extreme BLD
        events are not meant to be done in a competition-like setting, but instead need to be submitted individually
        with video evidence. Some other events also allow submitted results.
      </p>

      <h3 className="cc-basic-heading">Mission Statement</h3>
      <p>
        Our mission is to provide the go-to place for unofficial speedcubing results and to give the community the tools
        it needs to host speedcubing events. We aim to serve the interests of the community alongside the World Cube
        Association, and we follow the{" "}
        <a href="https://www.worldcubeassociation.org/about" target="_blank" rel="noopener">
          WCA Spirit
        </a>
        .
      </p>

      <h3 className="cc-basic-heading">The Team</h3>
      <p>
        We are a team of volunteers who work as admins on this website. Our activities include approving contests,
        publishing results, resolving critical incidents, and moderating the Cubing Contests Discord server. The admin
        team consists of the following members:
      </p>
      <ul>
        <li>Deni Mintsaev</li>
        <li>Ben Streeter</li>
        <li>Lucas Garron</li>
        <li>Chandler Pike</li>
        <li>Lars Johan Folde</li>
        <li>Aedan Bryant</li>
      </ul>

      <PartialHomePageDetails />
    </section>
  );
}

export default AboutPage;
