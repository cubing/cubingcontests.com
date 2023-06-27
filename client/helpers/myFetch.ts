import { API_BASE_URL } from './configuration';

const myFetch = {
  // async get() {},
  async post(url: string, body: any) {
    try {
      const res = await fetch(API_BASE_URL + url, {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      let json;

      if (res.headers.get('content-type')?.includes('application/json')) {
        json = await res.json();
      }

      if (res?.status >= 400) {
        let errors: string[];

        if (json.message) {
          if (typeof json.message === 'string') errors = [json.message];
          else errors = json.message;
        } else {
          errors = ['Unknown error'];
        }

        return { errors };
      } else if (json) {
        return json;
      }
    } catch (err: any) {
      return { errors: [err.message] };
    }
  },
};

export default myFetch;
