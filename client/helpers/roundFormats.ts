import { RoundFormat } from "./types.ts";

export type RoundFormatObject = {
  value: RoundFormat;
  label: string;
  shortLabel: string;
  attempts: number;
  isAverage: boolean;
};

export const roundFormats: RoundFormatObject[] = [
  {
    value: "1",
    label: "Best of 1",
    shortLabel: "Bo1",
    attempts: 1,
    isAverage: false,
  },
  {
    value: "2",
    label: "Best of 2",
    shortLabel: "Bo2",
    attempts: 2,
    isAverage: false,
  },
  {
    value: "3",
    label: "Best of 3",
    shortLabel: "Bo3",
    attempts: 3,
    isAverage: false,
  },
  {
    value: "m",
    label: "Mean of 3",
    shortLabel: "Mo3",
    attempts: 3,
    isAverage: true,
  },
  {
    value: "a",
    label: "Average of 5",
    shortLabel: "Ao5",
    attempts: 5,
    isAverage: true,
  },
];
