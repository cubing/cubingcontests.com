import { API_BASE_URL } from './configuration';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

// This must only be called with authorize = true on the client side
const doFetch = async (
  url: string,
  method: HttpMethod,
  revalidate: number | false,
  body: unknown = null,
  authorize = false,
) => {
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
      return null;
    }
  }

  let res, json;

  try {
    res = await fetch(API_BASE_URL + url, options);
  } catch (err: any) {
    console.error(err.message);
    return { errors: [err?.message || `Unknown error while fetching from ${url}`] };
  }

  // Get JSON if it was returned
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
    // If unauthorized, go to login page and delete jwt token from localstorage
    if ([401, 403].includes(res.status)) {
      localStorage.removeItem('jwtToken');
      window.location.href = '/login';
      return null;
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
    return json;
  }

  return null;
};

const myFetch = {
  async get(
    url: string,
    { authorize = false, revalidate = false }: { authorize?: boolean; revalidate?: number | false } = {
      authorize: false,
      revalidate: false,
    },
  ) {
    return await doFetch(url, 'GET', revalidate, null, authorize);
  },
  async post(url: string, body: unknown, { authorize = true }: { authorize?: boolean } = { authorize: true }) {
    return await doFetch(url, 'POST', false, body, authorize);
  },
  async patch(url: string, body: unknown, { authorize = true }: { authorize?: boolean } = { authorize: true }) {
    return await doFetch(url, 'PATCH', false, body, authorize);
  },
  // This method is client-only
  async getAdmin() {
    const jwtToken = localStorage.getItem('jwtToken');

    if (jwtToken) {
      let json;

      try {
        const res = await fetch(`${API_BASE_URL}/auth/validateadmin`, {
          headers: { Authorization: jwtToken },
          next: { revalidate: false },
        });
        json = await res.json();
      } catch (err: any) {
        console.error(err?.message || 'Unknown error while validating admin user');
      }

      if (json?.username) {
        return json;
      } else {
        window.location.href = '/login';
      }
    } else {
      window.location.href = '/login';
    }

    return null;
  },
};

export default myFetch;
