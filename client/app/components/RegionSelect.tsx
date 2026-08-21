"use client";

import { useQueryState } from "nuqs";
import FormRegionSelect from "~/app/components/form/FormRegionSelect.tsx";
import { C } from "~/helpers/constants.ts";

function RegionSelect() {
  const [region, setRegion] = useQueryState("region", { defaultValue: C.notSelectedOption, shallow: false });

  return <FormRegionSelect regionCode={region} setRegionCode={setRegion} continentOptions />;
}

export default RegionSelect;
