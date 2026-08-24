"use client";

import { TrustcaptchaComponent } from "@trustcomponent/trustcaptcha-react";
import { useContext, useEffect, useState } from "react";
import { MainContext } from "~/helpers/contexts.ts";

function Captcha() {
  const { theme } = useContext(MainContext);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_TRUSTCAPTCHA_SITE_KEY) setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <TrustcaptchaComponent
      sitekey={process.env.NEXT_PUBLIC_TRUSTCAPTCHA_SITE_KEY}
      failover-enabled="true"
      theme={theme}
      tokenFieldName="tcVerificationToken"
      fullWidth
      className="my-3"
    />
  );
}

export default Captcha;
