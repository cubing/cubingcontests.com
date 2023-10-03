// IMPORT THIS FILE LIKE THIS:
// import C from '@sh/constants';

const C = {
  contactEmail: 'cube327@tuta.io',
  fetchThrottleTimeout: 600, // the timeout in ms between doing repetitive fetch requests that need to be limited
  // Timeouts before revalidating a request
  rankingsRev: 300, //  5 minutes
  contestsRev: 60, // 1 minute
  contestInfoRev: 120, // 2 minutes
  contestResultsRev: 30, // 30 seconds
  maxRounds: 10, // maximum number of rounds allowed
  maxTime: 8640000, // 24 hours
  minCompetitorLimit: 5,
  wcaApiBase: 'https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/master/api',
  wcaIdRegex: /[0-9]{4}[A-Z]{4}[0-9]{2}/,
  wcaIdRegexLoose: /[0-9]{4}[a-zA-Z]{4}[0-9]{2}/, // allows lowercase letters too
};

export default C;
