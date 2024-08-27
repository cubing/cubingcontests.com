import { FetchObj, HttpMethod } from '@sh/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'production'
    ? process.env.API_BASE_URL_SERVER_SIDE || process.env.NEXT_PUBLIC_API_BASE_URL
    : 'http://localhost:5000/api';

// This must only be called with authorize = true on the client side.
// Returns { payload } if request was successful and a payload was received,
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

  if (method === 'GET') {
    // If authorize is true, that overrides the revalidate timeout
    if (authorize) options.next = { revalidate: 0 };
    else options.next = { revalidate };
  } else if (['POST', 'PUT', 'PATCH'].includes(method)) {
    options.headers['Content-type'] = 'application/json';
    if (body) {
      options.body = JSON.stringify(body);
    } else {
      console.error('Body cannot be empty');
      return { errors: ['Body cannot be empty'] };
    }
  } else if (method !== 'DELETE') {
    throw new Error(`Not implemented HTTP method: ${method}`);
  }

  // Add API base URL if the passed URL is not a full link
  if (!/^https?:\/\//.test(url)) url = API_BASE_URL + url;

  if (authorize) {
    const jwtToken = localStorage.getItem('jwtToken');

    if (jwtToken) {
      options.headers.Authorization = jwtToken;
    } else {
      if (!redirect) window.location.href = '/login';
      else window.location.href = `/login?redirect=${redirect}`;
      return {};
    }
  }

  // Fetch
  let res;

  try {
    res = await fetch(url, options);
  } catch (err: any) {
    console.error(err);
    return { errors: [err?.message || `Unknown error while fetching from ${url}`] };
  }

  // Get JSON, if it was returned. KEEP IN MIND THAT THE .json ENDPOINTS RETURN TEXT AND DON'T SET 400 STATUSES.
  let json;
  let blobby; // if dlFile = true, the file will be saved here
  let is404 = false;

  if (!fileName) {
    if (res.headers.get('content-type')?.includes('application/json')) {
      try {
        json = await res.json();
      } catch (err: any) {
        console.error(err);
        return { errors: [err?.message || 'Unknown error while parsing JSON'] };
      }
    } else if (url.slice(url.length - 5) === '.json') {
      try {
        json = JSON.parse(await res.text());
      } catch (err) {
        is404 = true;
      }
    }
  } else {
    blobby = await res.blob();
  }

  // Handle bad requests/server errors
  if (res.status >= 400 || is404) {
    // If unauthorized or forbidden, delete jwt token from localstorage and go to login page
    if ([401, 403].includes(res.status)) {
      localStorage.removeItem('jwtToken');
      if (!redirect) window.location.href = '/login';
      else window.location.replace(`/login?redirect=${redirect}`);
      return {};
    } else {
      let errors: string[];
      let errorData: any;

      if (json?.message) {
        // Sometimes the server returns the message as a single string and sometimes as an array of messages
        if (typeof json.message === 'string') errors = [json.message];
        else errors = json.message;

        errors = errors.filter((err) => err.trim() !== '');
        errorData = json.data;
      } else if (res.status === 404 || is404) {
        errors = [`Not found: ${url}`];
      } else {
        errors = ['Unknown error'];
      }

      return { errors, errorData };
    }
  } else if (!fileName && json) {
    return { payload: json };
  } else if (fileName) {
    const anchor = document.createElement('a');
    document.body.appendChild(anchor);
    const objectUrl = window.URL.createObjectURL(blobby);

    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.click();

    window.URL.revokeObjectURL(objectUrl);
    return {};
  }

  // If no JSON payload or error was returned, just get the response text
  return { payload: await res.text() } as FetchObj;
};

export const ssrFetch = async <T = any>(
  url: string,
  { revalidate = 0 }: { revalidate?: number | false } = { revalidate: 0 },
): Promise<FetchObj<T>> => {
  return await doFetch<T>(url, 'GET', { revalidate, authorize: false });
};
