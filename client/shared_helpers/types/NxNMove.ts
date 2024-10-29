export const nxnMoves = [
  "U",
  "L",
  "F",
  "R",
  "B",
  "D",
  "U'",
  "L'",
  "F'",
  "R'",
  "B'",
  "D'",
  "U2",
  "L2",
  "F2",
  "R2",
  "B2",
  "D2",
] as const;

export type NxNMove = (typeof nxnMoves)[number];
