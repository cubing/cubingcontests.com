"use client";

import { usePathname, useSearchParams } from "next/navigation";
import FormCountrySelect from "~/app/components/form/FormCountrySelect";

function RegionSelect() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const region = searchParams.get("region") || "NOT_SELECTED";

  const onChangeCountryIso2 = (newRegion: string) => {
    if (newRegion !== region) {
      let queryString = newRegion && newRegion !== "NOT_SELECTED" ? `region=${newRegion}` : "";

      searchParams.forEach((val, key) => {
        if (key !== "region") queryString += `${queryString ? "&" : ""}${key}=${val}`;
      });

      window.location.assign(`${pathname}${queryString ? `?${queryString}` : ""}`);
    }
  };

  return <FormCountrySelect countryIso2={region} setCountryIso2={onChangeCountryIso2} continentOptions />;
}

export default RegionSelect;
