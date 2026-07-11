export const C = {
  recordRanksLink: "https://recordranks.com",
  rrContactLink: "https://recordranks.com/contact",
  sourceCodeLink: "https://github.com/mintydev789/RecordRanks",
  rrDonationLink: "https://ko-fi.com/mintydev",
  discordServerLink: "https://discord.gg/7rRMQA8jnU",
  fetchDebounceTimeout: 750, // the timeout in ms between doing repetitive fetch requests that need to be limited
  maxRounds: 4,
  minResultsForThreeMoreRounds: 100,
  minResultsForTwoMoreRounds: 16,
  minResultsForOneMoreRound: 8,
  maxTime: 24 * 60 * 60 * 100, // 24 hours
  maxTimeHumanReadable: "24000000", // MUST MATCH maxTime!
  maxResult: 999_999_999_999_999, // accounts for max possible Multi-Blind result
  maxNumberFormatValue: 999,
  maxTimeLimit: 60 * 60 * 100, // 1 hour
  maxContestShortName: 32,
  defaultTimeLimit: 10 * 60 * 100, // 10 minutes
  minCompetitorLimit: 5,
  minCompetitorsForNonWca: 3,
  maxConfirmationCodeAttempts: 3,
  minProceedNumber: 2,
  maxProceedPercentage: 75,
  maxTotalEvents: 30, // this is hardcoded on the rules page
  maxTotalMeetupEvents: 15, // this is hardcoded on the rules page
  maxPersonMatches: 6,
  maxRankings: 100_000,
  minSlugCharacters: 8,
  maxSlugCharacters: 24,
  wcaApiBaseUrl: "https://api.worldcubeassociation.org",
  wcaV0ApiBaseUrl: "https://www.worldcubeassociation.org/api/v0",
  wcaIdRegex: /[0-9]{4}[A-Z]{4}[0-9]{2}/,
  wcaIdRegexLoose: /[0-9]{4}[a-zA-Z]{4}[0-9]{2}/, // allows lowercase letters too
  navigationKeys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"],
  notSelectedOption: "NOT_SELECTED",
  onlineCompKey: "ONLINE",
  publicExportsFormatVersions: ["v1"],
  defaultRecordTypeValues: ["WR", "ER", "NAR", "SAR", "AsR", "AfR", "OcR", "NR"],
  message: {
    unknownError: "Unknown error",
    videoNoLongerAvailable: "Video no longer available",
    maxMonthlyContestsReached: "This space has reached its monthly competitions limit",
    oldResultWithRecordValidationError:
      "The result is more than 30 days old and contains a record, which could affect other records. Please contact the admin team.",
  },
  color: {
    rankingHighlight: "#10c010",
    // These are the same as the Bootstrap colors
    primary: "#0d6efd",
    success: "#198754",
    warning: "#ffc107",
    danger: "#dc3545",
  },
} as const;

export const IS_RR_INSTANCE = process.env.NEXT_PUBLIC_BASE_URL === "https://app.recordranks.com";
export const IS_CUBING_CONTESTS_INSTANCE = process.env.NEXT_PUBLIC_BASE_URL === "https://cubingcontests.com";

const providers = process.env.NEXT_PUBLIC_AUTH_PROVIDERS!.split(",");
export const HAS_CREDENTIAL_AUTH = providers.includes("credential");
export const HAS_WCA_AUTH = providers.includes("wca");
export const HAS_GOOGLE_AUTH = providers.includes("google");
