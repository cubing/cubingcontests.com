import { FetchErrorObj, FetchObj, HttpMethod } from "~/helpers/types.ts";

// Server-side one won't be available client-side or in development
const apiBaseUrl = process.env.SERVER_SIDE_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL;

// This must only be called with authorize = true on the client side.
// Returns { data } if request was successful and a data was received,
// { errors } if there were errors, or {}.
export const doFetch = async <T = any>(
  url: string,
  method: HttpMethod,
  {
    body,
    revalidate = 0,
    authorize = true,
    redirect,
    fileName,
  }: {
    body?: unknown;
    revalidate?: number | false;
    authorize?: boolean;
    redirect?: string;
    fileName?: string;
  } = { body: null, revalidate: 0, authorize: true },
): Promise<FetchObj<T>> => {
  const options: any = { method, headers: {} };

  if (method === "GET") {
    // If authorize is true, that overrides the revalidate timeout
    if (authorize) options.next = { revalidate: 0 };
    else options.next = { revalidate };
  } else if (["POST", "PUT", "PATCH"].includes(method)) {
    options.headers["Content-type"] = "application/json";
    if (body) {
      options.body = JSON.stringify(body);
    } else {
      console.error("Body cannot be empty");
      return {
        success: false,
        error: [{ code: "BAD_REQUEST", message: "Body cannot be empty" }],
      };
    }
  } else if (method !== "DELETE") {
    throw new Error(`Not implemented HTTP method: ${method}`);
  }

  // Add API base URL if the passed URL is not a full link
  if (!/^https?:\/\//.test(url)) url = apiBaseUrl + url;

  if (authorize) {
    const jwtToken = localStorage.getItem("jwtToken");

    if (jwtToken) {
      options.headers.Authorization = jwtToken;
    } else {
      if (!redirect) window.location.href = "/login";
      else window.location.href = `/login?redirect=${redirect}`;
      return { success: false, error: [{ code: "Unauthorized" }] };
    }
  }

  // Fetch
  let res;

  try {
    res = await fetch(url, options);
  } catch (err: any) {
    console.error(err);
    return {
      success: false,
      error: [err?.message || `Unknown error while fetching from ${url}`],
    };
  }

  // Get JSON, if it was returned. KEEP IN MIND THAT THE .json ENDPOINTS RETURN TEXT AND DON'T SET 400 STATUSES.
  let json;
  let is404 = false;

  if (!fileName) {
    if (res.headers.get("content-type")?.includes("application/json")) {
      try {
        json = await res.json();
      } catch (err: any) {
        console.error(err);
        return {
          success: false,
          error: [err?.message || "Unknown error while parsing JSON"],
        };
      }
    } else if (url.slice(url.length - 5) === ".json") {
      try {
        json = JSON.parse(await res.text());
      } catch (_e) {
        is404 = true;
      }
    }
  }

  // Handle bad requests/server errors
  if (res.status >= 400 || is404) {
    if ([401, 403].includes(res.status)) {
      if (!redirect) window.location.href = "/login";
      else window.location.replace(`/login?redirect=${redirect}`);
      return { success: false, error: [{ code: "UNAUTHORIZED" }] };
    } else {
      let errors: FetchErrorObj[];
      let data: any;

      if (json?.message) {
        // Sometimes the server returns the message as a single string and sometimes as an array of messages
        // THIS IS NOT RIGHT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        if (typeof json.message === "string") errors = [json];
        else errors = json;
        // errors = errors.filter((err) => err.trim() !== "");
        data = json.data;
      } else if (res.status === 404 || is404) {
        errors = [{ code: "NOT_FOUND", message: `Not found: ${url}` }];
      } else {
        errors = [{ code: "Unknown error" }];
      }

      return { success: false, error: errors };
    }
  } else if (!fileName && json) {
    return { success: true, data: json };
  } else if (fileName) {
    const anchor = document.createElement("a");
    document.body.appendChild(anchor);
    const blobby = await res.blob();
    const objectUrl = window.URL.createObjectURL(blobby);

    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.click();

    window.URL.revokeObjectURL(objectUrl);
    return { success: true, data: {} as any };
  }

  // If no JSON payload or error was returned, just get the response text
  return { success: true, data: await res.text() as any };
};

export const ssrFetch = async <T = any>(
  url: string,
  { revalidate = 0 }: { revalidate?: number | false } = { revalidate: 0 },
): Promise<FetchObj<T>> => {
  return await doFetch<T>(url, "GET", { revalidate, authorize: false });
};
