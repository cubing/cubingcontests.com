export const nxnMoves = [
  'U',
  "U'",
  'U2',
  'L',
  "L'",
  'L2',
  'F',
  "F'",
  'F2',
  'R',
  "R'",
  'R2',
  'B',
  "B'",
  'B2',
  'D',
  "D'",
  'D2',
] as const;

export type NxNMove = (typeof nxnMoves)[number];
