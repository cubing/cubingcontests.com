import { type NextRequest, NextResponse } from "next/server";
import { logMessage } from "~/server/server-only-functions/server-only-functions.ts";

function log(url: URL) {
  logMessage("RR0001", `Page visit: ${url.pathname}${url.search}`, {
    metadata: { pathname: url.pathname, queryString: url.search },
  });
}

export function proxy(request: NextRequest) {
  const url = new URL(request.url);
  const routes =
    "about|competitions|export|moderator-instructions|blog|rankings|records|persons|rules|video-based-results";

  if (process.env.NEXT_PUBLIC_MULTITENANCY_ENABLED === "true") {
    const isLoggablePage = new RegExp(`^/[^/]+(/|/(${routes})(/.*)?)?$`).test(url.pathname);

    if (isLoggablePage) log(url);
  } else {
    const isLoggablePage = url.pathname === "/" || new RegExp(`^/(${routes})(/.*)?$`).test(url.pathname);

    if (isLoggablePage) log(url);

    // Single tenancy routing support

    const isPathWithSlug = url.pathname === "/" || new RegExp(`^/(mod|${routes})(/.*)?$`).test(url.pathname);

    if (isPathWithSlug) {
      return NextResponse.rewrite(request.url.replace(url.host, `${url.host}/default`));
    } else {
      const isApiPathWithSlug = /^\/api\/(events|results|enter-attempt|enter-results)(\/.*)?$/.test(url.pathname);
      if (isApiPathWithSlug)
        return NextResponse.rewrite(request.url.replace(`${url.host}/api`, `${url.host}/api/default`));
    }
  }
}

export const config = {};
