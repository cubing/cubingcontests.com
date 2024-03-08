// IMPORT THIS FILE LIKE THIS:
// import C from '@sh/constants';

const C = {
  contactEmail: 'cubing-contests-admin@googlegroups.com',
  fetchThrottleTimeout: 600, // the timeout in ms between doing repetitive fetch requests that need to be limited
  // Timeouts before revalidating a request
  rankingsRev: 300, //  5 minutes
  contestsRev: 60, // 1 minute
  contestInfoRev: 120, // 2 minutes
  contestResultsRev: 30, // 30 seconds
  maxRounds: 10, // maximum number of rounds allowed
  maxTime: 8640000, // 24 hours (IF THIS IS EVER UPDATED, ALSO CONSIDER THE LINES WITH 24000000 IN AttemptInput)
  maxTimeLimit: 60000, // 10 minutes
  maxCumulativeTimeLimit: 360000, // 1 hour
  minCompetitorLimit: 5,
  wcaApiBase: 'https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/master/api',
  wcaIdRegex: /[0-9]{4}[A-Z]{4}[0-9]{2}/,
  wcaIdRegexLoose: /[0-9]{4}[a-zA-Z]{4}[0-9]{2}/, // allows lowercase letters too
  navigationKeys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'],
  smallButtonPadding: '0.1rem 0.45rem',
};

export default C;
