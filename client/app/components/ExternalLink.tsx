type Props = {
  href: "wca" | "wca-regulations" | "cubingjs" | "cstimer";
};

const ExternalLink = ({ href }: Props) => {
  if (href === "wca") {
    return <a href="https://www.worldcubeassociation.org/" target="_blank">WCA</a>;
  }

  if (href === "wca-regulations") {
    return <a href="https://www.worldcubeassociation.org/regulations/full/" target="_blank">WCA Regulations</a>;
  }

  if (href === "cubingjs") {
    return <a href="https://experiments.cubing.net/cubing.js/mark3/" target="_blank">cubing.js</a>;
  }

  if (href === "cstimer") {
    return <a href="https://cstimer.net/" target="_blank">csTimer</a>;
  }
};

export default ExternalLink;
