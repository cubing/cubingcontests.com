type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
interface IFetchObj {
  payload?: any;
  errors?: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

// This must only be called with authorize = true on the client side.
// Returns { payload } if request was successful and a payload was received,
// { errors } if there were errors, or {}.
const doFetch = async (
  url: string,
  method: HttpMethod,
  revalidate: number | false,
  body: unknown = null,
  authorize = false,
): Promise<IFetchObj> => {
  const options: any = { method, headers: {} };

  if (method === 'GET') {
    options.next = { revalidate };
  } else if (method === 'POST' || method === 'PATCH') {
    options.headers['Content-type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  if (authorize) {
    const jwtToken = localStorage.getItem('jwtToken');

    if (jwtToken) {
      options.headers.Authorization = jwtToken;
    } else {
      window.location.href = '/login';
      return {};
    }
  }

  // Fetch
  let res;

  try {
    res = await fetch(API_BASE_URL + url, options);
  } catch (err: any) {
    console.error(err.message);
    return { errors: [err?.message || `Unknown error while fetching from ${url}`] };
  }

  // Get JSON if it was returned
  let json;

  if (res.headers.get('content-type')?.includes('application/json')) {
    try {
      json = await res.json();
    } catch (err: any) {
      console.error(err.message);
      return { errors: [err?.message || 'Unknown error while parsing JSON'] };
    }
  }

  // Handle bad requests/server errors
  if (res.status >= 400) {
    // If unauthorized, delete jwt token from localstorage and go to login page
    if ([401, 403].includes(res.status)) {
      localStorage.removeItem('jwtToken');
      window.location.href = '/login';
      return {};
    } else {
      let errors: string[];

      if (json.message) {
        // Sometimes the server returns the message as a single string and sometimes as an array of messages
        if (typeof json.message === 'string') errors = [json.message];
        else errors = json.message;

        console.error(json);
      } else {
        errors = ['Unknown error'];
      }

      return { errors };
    }
  } else if (json) {
    return { payload: json };
  }

  // If no JSON payload or error was returned, just get the response text
  return { payload: await res.text() };
};

const myFetch = {
  async get(
    url: string,
    { authorize = false, revalidate = false }: { authorize?: boolean; revalidate?: number | false } = {
      authorize: false,
      revalidate: false,
    },
  ): Promise<IFetchObj> {
    return await doFetch(url, 'GET', revalidate, null, authorize);
  },
  async post(
    url: string,
    body: unknown,
    { authorize = true }: { authorize?: boolean } = { authorize: true },
  ): Promise<IFetchObj> {
    return await doFetch(url, 'POST', false, body, authorize);
  },
  async patch(
    url: string,
    body: unknown,
    { authorize = true }: { authorize?: boolean } = { authorize: true },
  ): Promise<IFetchObj> {
    return await doFetch(url, 'PATCH', false, body, authorize);
  },
  // This method is client-only, because local storage is used
  async getAdmin() {
    const jwtToken = localStorage.getItem('jwtToken');

    if (jwtToken) {
      let json;

      try {
        const res = await fetch(`${API_BASE_URL}/auth/validateadmin`, {
          headers: { Authorization: jwtToken },
        });

        json = await res.json();
      } catch (err: any) {
        console.error(err?.message || 'Unknown error while validating admin user');
      }

      if (json?.personId) {
        return json;
      } else {
        window.location.href = '/login?redirect=admin';
      }
    } else {
      window.location.href = '/login?redirect=admin';
    }

    return null;
  },
};

export default myFetch;
