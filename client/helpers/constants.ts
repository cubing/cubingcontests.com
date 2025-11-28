export const C = {
  contactEmail: "cubing-contests-admin@googlegroups.com",
  sourceCodeLink: "https://github.com/mintydev789/cubingcontests.com",
  discordServerLink: "https://discord.gg/7rRMQA8jnU",
  fetchDebounceTimeout: 600, // the timeout in ms between doing repetitive fetch requests that need to be limited
  maxRounds: 4,
  minResultsForThreeMoreRounds: 100,
  minResultsForTwoMoreRounds: 16,
  minResultsForOneMoreRound: 8,
  maxTime: 24 * 60 * 60 * 100, // 24 hours (IF THIS IS EVER UPDATED, ALSO CONSIDER THE LINES WITH 24000000 IN AttemptInput)
  maxFmMoves: 999,
  maxTimeLimit: 60 * 60 * 100, // 1 hour
  defaultTimeLimit: 10 * 60 * 100, // 10 minutes
  minCompetitorLimit: 5,
  minCompetitorsForNonWca: 3,
  maxConfirmationCodeAttempts: 3,
  minProceedNumber: 2,
  maxProceedPercentage: 75,
  maxTotalMeetupRounds: 15,
  maxPersonMatches: 6,
  duePerCompetitor: 0.1,
  wcaUnofficialApiBaseUrl: "https://raw.githubusercontent.com/robiningelbrecht/wca-rest-api/master/api",
  wcaV0ApiBaseUrl: "https://www.worldcubeassociation.org/api/v0",
  wcaIdRegex: /[0-9]{4}[A-Z]{4}[0-9]{2}/,
  wcaIdRegexLoose: /[0-9]{4}[a-zA-Z]{4}[0-9]{2}/, // allows lowercase letters too
  navigationKeys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"],
  moneroDonationAddress:
    "8AaML2et9RQKmZp4NYm9STKbjhfFB4h81ZxeGV166oapNzPFUTneaRmakwE61cyHr1ZUYreEU7eHF8XmMBykG8TpAwM6SVq",
  unknownErrorMsg: "Unknown error",
  videoNoLongerAvailableMsg: "Video no longer available",
  color: {
    // These are the same as the Bootstrap colors
    primary: "#0d6efd",
    success: "#198754",
    warning: "#ffc107",
    danger: "#dc3545",
  },
};
