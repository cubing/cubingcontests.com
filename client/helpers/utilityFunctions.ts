import jwtDecode from "jwt-decode";
import { isSameDay, isSameMonth, isSameYear } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { remove as removeAccents } from "remove-accents";
import { Color, EventFormat, Role } from "~/shared_helpers/enums.ts";
import C from "~/shared_helpers/constants.ts";
import { IEvent, IFeAttempt, type IRoundFormat, ITimeLimit, type NumberInputValue } from "~/shared_helpers/types.ts";
import { type MultiChoiceOption, UserInfo } from "./types.ts";

export const getFormattedDate = (startDate: Date | string, endDate?: Date | string | null): string => {
  if (!startDate) throw new Error("Start date missing!");

  if (typeof startDate === "string") startDate = new Date(startDate);
  if (typeof endDate === "string") endDate = new Date(endDate);

  const fullFormat = "d MMM yyyy";

  if (!endDate || isSameDay(startDate, endDate)) {
    return formatInTimeZone(startDate, "UTC", fullFormat);
  } else {
    let startFormat: string;

    if (!isSameYear(startDate, endDate)) startFormat = fullFormat;
    else if (!isSameMonth(startDate, endDate)) startFormat = "d MMM";
    else startFormat = "d";

    return `${formatInTimeZone(startDate, "UTC", startFormat)} - ${formatInTimeZone(endDate, "UTC", fullFormat)}`;
  }
};

// Returns null if the time is invalid
const getCentiseconds = (
  time: string, // the time string without formatting (e.g. 1:35.97 should be "13597")
  { round = true, throwErrorWhenInvalidTime = false }: {
    round?: boolean;
    throwErrorWhenInvalidTime?: boolean;
  } = { round: true, throwErrorWhenInvalidTime: false },
): number | null => {
  if (time === "") return 0;

  let hours = 0;
  let minutes = 0;
  let centiseconds: number;

  if (time.length >= 5) {
    // Round attempts >= 10 minutes long, unless noRounding = true
    if (time.length >= 6 && round) time = time.slice(0, -2) + "00";

    if (time.length >= 7) hours = parseInt(time.slice(0, time.length - 6));
    minutes = parseInt(time.slice(Math.max(time.length - 6, 0), -4));
    centiseconds = parseInt(time.slice(-4));
  } else {
    centiseconds = parseInt(time);
  }

  // Disallow >60 minutes, >60 seconds, and times more than 24 hours long
  if (minutes >= 60 || centiseconds >= 6000 || hours > 24 || (hours === 24 && minutes > 0 && centiseconds > 0)) {
    if (throwErrorWhenInvalidTime) {
      throw new Error(
        `Invalid time: ${time}. Debug info: hours = ${hours}, minutes = ${minutes}, centiseconds = ${centiseconds}, time = ${time}, round = ${round}`,
      );
    }
    return null;
  }

  return hours * 360000 + minutes * 6000 + centiseconds;
};

// Returns null if the time is invalid (e.g. 8145); returns 0 if it's empty.
// solved and attempted are only required for the Multi event format.
export const getAttempt = (
  attempt: IFeAttempt,
  event: IEvent,
  time: string, // a time string without formatting (e.g. 1534 represents 15.34, 25342 represents 2:53.42)
  {
    roundTime = false,
    roundMemo = false,
    solved,
    attempted,
    memo,
  }: {
    roundTime?: boolean;
    roundMemo?: boolean;
    // These three parameters are optional if the event format is Number
    solved?: NumberInputValue;
    attempted?: NumberInputValue;
    memo?: string; // only used for events with the event group HasMemo
  } = { roundTime: false, roundMemo: false },
): IFeAttempt => {
  if (time.length > 8 || (memo && memo.length > 8)) throw new Error("Times longer than 8 digits are not supported");

  const maxFmResultDigits = C.maxFmMoves.toString().length;
  if (time.length > maxFmResultDigits && event.format === EventFormat.Number) {
    throw new Error(`Fewest Moves solutions longer than ${maxFmResultDigits} digits are not supported`);
  }

  if (event.format === EventFormat.Number) return { ...attempt, result: time ? parseInt(time) : 0 };

  const newAttempt: IFeAttempt = { result: getCentiseconds(time, { round: roundTime }) };
  if (memo) {
    newAttempt.memo = getCentiseconds(memo, { round: roundMemo });
    if (newAttempt.memo && newAttempt.result && newAttempt.memo >= newAttempt.result) {
      return { ...newAttempt, result: null };
    }
  }

  if (event.format === EventFormat.Multi && newAttempt.result) {
    if (typeof solved !== "number" || typeof attempted !== "number" || solved > attempted) return { result: null };

    const maxTime = Math.min(attempted, 6) * 60000 + attempted * 200; // accounts for +2s

    // Disallow submitting multi times > max time, and <= 1 hour for old style
    if (event.eventId === "333mbf" && newAttempt.result > maxTime) {
      return { ...newAttempt, result: null };
    } else if (event.eventId === "333mbo" && newAttempt.result <= 360000) {
      return { ...newAttempt, result: null };
    }

    // See the IResult interface for information about how this works
    let multiOutput = ""; // DDDDTTTTTTTMMMM
    const missed: number = attempted - solved;
    let points: number = solved - missed;

    if (points <= 0) {
      if (points < 0 || solved < 2) multiOutput += "-";
      points = -points;
    }

    multiOutput += 9999 - points;
    multiOutput += new Array(7 - newAttempt.result.toString().length).fill("0").join("") + newAttempt.result;
    multiOutput += new Array(4 - missed.toString().length).fill("0").join("") + missed;

    newAttempt.result = parseInt(multiOutput);
  }

  return newAttempt;
};

// Returns the authenticated user's info
export const getUserInfo = (): UserInfo => {
  if (typeof localStorage !== "undefined") {
    const token = localStorage.getItem("jwtToken");

    if (token) {
      // Decode the JWT (only take the part after "Bearer ")
      const authorizedUser: any = jwtDecode(token.split(" ")[1]);

      const userInfo: UserInfo = {
        id: authorizedUser.sub,
        username: authorizedUser.username,
        personId: authorizedUser.personId,
        roles: authorizedUser.roles,
        isAdmin: authorizedUser.roles.includes(Role.Admin),
        isMod: authorizedUser.roles.includes(Role.Moderator),
      };

      return userInfo;
    }
  }
};

export const getBSClassFromColor = (color: Color | undefined): string => {
  // THE MAGENTA OPTION IS SKIPPED FOR NOW
  switch (color) {
    case Color.Red:
      return "danger";
    case Color.Blue:
      return "primary";
    case Color.Green:
      return "success";
    case Color.Yellow:
      return "warning";
    case Color.White:
      return "light";
    case Color.Cyan:
      return "info";
    case Color.Black:
      return "dark";
    default: {
      console.error(`Unknown color: ${color}`);
      return "dark";
    }
  }
};

export const getContestIdFromName = (name: string): string => {
  let output = removeAccents(name).replaceAll(/[^a-zA-Z0-9 ]/g, "");
  const parts = output.split(" ");

  output = parts.filter((el) => el !== "").map((el) => el[0].toUpperCase() + el.slice(1)).join("");

  return output;
};

export const genericOnKeyDown = (
  e: any,
  {
    nextFocusTargetId,
    onKeyDown,
    submitOnEnter,
  }: {
    nextFocusTargetId?: string;
    onKeyDown?: (e: any) => void;
    submitOnEnter?: boolean;
  },
) => {
  if (e.key === "Enter") {
    if (!submitOnEnter) e.preventDefault();
    if (nextFocusTargetId) document.getElementById(nextFocusTargetId)?.focus();
  }

  if (onKeyDown) onKeyDown(e);
};

export const shortenEventName = (name: string): string => {
  return name
    .replaceAll("2x2x2", "2x2")
    .replaceAll("3x3x3", "3x3")
    .replaceAll("4x4x4", "4x4")
    .replaceAll("5x5x5", "5x5")
    .replaceAll("6x6x6", "6x6")
    .replaceAll("7x7x7", "7x7")
    .replaceAll("8x8x8", "8x8")
    .replaceAll("9x9x9", "9x9")
    .replaceAll("10x10x10", "10x10")
    .replaceAll("11x11x11", "11x11")
    .replace("Blindfolded", "BLD")
    .replace("Multi-Blind", "MBLD")
    .replace("One-Handed", "OH")
    .replace("Match The Scramble", "MTS")
    .replace("Face-Turning Octahedron", "FTO")
    .replace(" Cuboid", "")
    .replace(" Challenge", "")
    .replace("Three 3x3 Cubes", "3x 3x3");
};

export const logOutUser = () => {
  localStorage.removeItem("jwtToken");
  window.location.href = "/";
};

export const getIsWebglSupported = (): boolean => {
  try {
    const canvas = document.createElement("canvas");
    const webglContext = canvas.getContext("webgl");
    const webglExperimentalContext = canvas.getContext("experimental-webgl");

    return !!(window.WebGLRenderingContext && webglContext && webglExperimentalContext);
  } catch (_e) {
    return false;
  }
};

export const getTimeLimit = (eventFormat: EventFormat): ITimeLimit | undefined =>
  eventFormat === EventFormat.Time ? { centiseconds: 60000, cumulativeRoundIds: [] } : undefined;

export const getRoundFormatOptions = (roundFormats: IRoundFormat[]): MultiChoiceOption[] =>
  roundFormats.map((rf) => ({ label: rf.label, value: rf.value }));
