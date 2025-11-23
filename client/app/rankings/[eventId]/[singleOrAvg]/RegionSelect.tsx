"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FormCountrySelect from "~/app/components/form/FormCountrySelect.tsx";

function RegionSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const region = searchParams.get("region") || "NOT_SELECTED";

  const onChangeCountryIso2 = (newRegion: string) => {
    if (newRegion !== region) {
      let queryString = newRegion === "NOT_SELECTED" ? "" : `region=${newRegion}`;

      searchParams.forEach((val, key) => {
        if (key !== "region") queryString += `${queryString ? "&" : ""}${key}=${val}`;
      });

      router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`);
    }
  };

  return <FormCountrySelect countryIso2={region} setCountryIso2={onChangeCountryIso2} continentOptions />;
}

export default RegionSelect;
