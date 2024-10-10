const ExternalLink = ({ to }: { to: 'wca' | 'wca-regulations' | 'cubingjs' | 'cstimer' }) => {
  if (to === 'wca')
    return (
      <a href="https://www.worldcubeassociation.org/" target="_blank">
        WCA
      </a>
    );

  if (to === 'wca-regulations')
    return (
      <a href="https://www.worldcubeassociation.org/regulations/full/" target="_blank">
        WCA Regulations
      </a>
    );

  if (to === 'cubingjs')
    return (
      <a href="https://experiments.cubing.net/cubing.js/mark3/" target="_blank">
        cubing.js
      </a>
    );

  if (to === 'cstimer')
    return (
      <a href="https://cstimer.net/" target="_blank">
        csTimer
      </a>
    );
};

export default ExternalLink;
