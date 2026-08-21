"use client";

import * as Flags from "country-flag-icons/react/3x2";
import useSWR from "swr";
import { SwrKey } from "~/helpers/swr-keys.ts";
import type { RegionResponse } from "~/server/db/schema/regions.ts";

type Props = {
  regionCode: string;
  swapPositions?: boolean;
} & (
  | {
      shorten?: never;
      noText?: boolean;
    }
  | {
      shorten?: boolean;
      noText?: never;
    }
);

function Region({ regionCode, swapPositions, noText, shorten }: Props) {
  const { data: regions }: { data: RegionResponse[] } = useSWR(SwrKey.Regions, { suspense: true });

  const FlagComponent = (Flags as any)[regionCode];

  const getRegion = (regionCode: string): string => {
    const region = regions.find((c) => c.code === regionCode);

    if (!region) return "NOT FOUND";

    if (shorten && region.shortName) return region.shortName;

    return region.name;
  };

  return (
    <span className="d-inline-flex gap-2 align-items-center">
      {!noText && swapPositions && getRegion(regionCode)}
      {FlagComponent
        ? FlagComponent({ title: getRegion(regionCode), className: "rr-flag-icon", style: { height: "1.16rem" } })
        : undefined}
      {!noText && !swapPositions && getRegion(regionCode)}
    </span>
  );
}

export default Region;
