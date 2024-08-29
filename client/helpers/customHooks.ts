'use client';

import { useContext, useState } from 'react';
import { doFetch } from '~/helpers/fetchUtils';
import { getBestAndAverage } from '@sh/sharedFunctions';
import { FetchObj, IContestDto, IEvent, IWcaPersonDto, IPerson, IPersonDto, IResult, IRound } from '@sh/types';
import { RoundFormat } from '@sh/enums';
import { ContestType } from '@sh/enums';
import C from '@sh/constants';
import { MainContext } from '~/helpers/contexts';

type FetchOptions = {
  authorize?: boolean;
  // If loadingId is defined, the myFetch function will handle setting the loading ID and manage error messages.
  // If it's undefined, it will still do that, but loadingId will be '_'. If it's null, that functionality will be disabled.
  loadingId?: string | null;
  keepLoadingAfterSuccess?: boolean;
};

export const useMyFetch = () => {
  const { changeErrorMessages, changeLoadingId, resetMessagesAndLoadingId, resetMessages } = useContext(MainContext);

  const reset = (response: FetchObj, keepLoadingAfterSuccess: boolean) => {
    if (response.errors) changeErrorMessages(response.errors);
    else if (keepLoadingAfterSuccess) resetMessages();
    else resetMessagesAndLoadingId();
  };

  return {
    async get<T = any>(
      url: string,
      {
        authorize = false,
        redirect,
        fileName,
        loadingId,
        keepLoadingAfterSuccess,
      }: FetchOptions & {
        redirect?: string; // this can only be set if authorize is set too
        fileName?: string;
      } = { authorize: false },
    ): Promise<FetchObj<T>> {
      if (loadingId !== null) changeLoadingId(loadingId || '_');
      const response = await doFetch<T>(url, 'GET', { authorize, redirect, fileName });
      if (loadingId !== null) reset(response, keepLoadingAfterSuccess);
      return response;
    },
    async post<T = any>(
      url: string,
      body: unknown,
      { authorize = true, loadingId, keepLoadingAfterSuccess }: FetchOptions = {
        authorize: true,
      },
    ): Promise<FetchObj<T>> {
      if (loadingId !== null) changeLoadingId(loadingId || '_');
      const response = await doFetch<T>(url, 'POST', { body, authorize });
      if (loadingId !== null) reset(response, keepLoadingAfterSuccess);
      return response;
    },
    async put<T = any>(
      url: string,
      body: unknown,
      { loadingId, keepLoadingAfterSuccess }: FetchOptions = {},
    ): Promise<FetchObj<T>> {
      if (loadingId !== null) changeLoadingId(loadingId || '_');
      const response = await doFetch<T>(url, 'PUT', { body });
      if (loadingId !== null) reset(response, keepLoadingAfterSuccess);
      return response;
    },
    async patch<T = any>(
      url: string,
      body: unknown,
      { loadingId, keepLoadingAfterSuccess }: FetchOptions = {},
    ): Promise<FetchObj<T>> {
      if (loadingId !== null) changeLoadingId(loadingId || '_');
      const response = await doFetch<T>(url, 'PATCH', { body });
      if (loadingId !== null) reset(response, keepLoadingAfterSuccess);
      return response;
    },
    async delete<T = any>(
      url: string,
      { loadingId, keepLoadingAfterSuccess }: FetchOptions = {},
    ): Promise<FetchObj<T>> {
      if (loadingId !== null) changeLoadingId(loadingId || '_');
      const response = await doFetch<T>(url, 'DELETE');
      if (loadingId !== null) reset(response, keepLoadingAfterSuccess);
      return response;
    },
  };
};

export const useFetchWcaCompDetails = () => {
  const myFetch = useMyFetch();
  const fetchPerson = useFetchPerson();

  return async (competitionId: string): Promise<IContestDto> => {
    const { payload: wcaCompData, errors: e1 } = await myFetch.get(
      `${C.wcaApiBase}/competitions/${competitionId}.json`,
      { loadingId: null },
    );

    if (e1) throw new Error(e1[0]);

    // This is for getting the competitor limit, organizer WCA IDs, and delegate WCA IDs
    const { payload: wcaV0CompData, errors: e2 } = await myFetch.get(
      `https://www.worldcubeassociation.org/api/v0/competitions/${competitionId}`,
      { loadingId: null },
    );

    // Sometimes the competitor limit does not exist
    const competitorLimit = wcaV0CompData.competitor_limit || 10;
    const startDate = new Date(wcaCompData.date.from);
    const endDate = new Date(wcaCompData.date.till);
    const newContest: IContestDto = {
      competitionId,
      name: wcaCompData.name,
      shortName: wcaV0CompData.short_name,
      type: ContestType.WcaComp,
      city: wcaCompData.city,
      countryIso2: wcaCompData.country,
      // Gets rid of the link and just takes the venue name
      venue: wcaCompData.venue.name.split(']')[0].replace('[', ''),
      address: wcaCompData.venue.address,
      latitudeMicrodegrees: Math.round(wcaCompData.venue.coordinates.latitude * 1000000),
      longitudeMicrodegrees: Math.round(wcaCompData.venue.coordinates.longitude * 1000000),
      startDate,
      endDate,
      organizers: [], // this is set below
      description: '',
      competitorLimit,
      events: [],
      // compDetails.schedule needs to be set by an admin manually
    };

    if (e2) throw new Error(e2[0]);

    const notFoundPersonNames: string[] = [];

    // Set organizer objects
    for (const org of [...wcaV0CompData.organizers, ...wcaV0CompData.delegates]) {
      const name = org.name;
      let person: IPerson;

      if (org.wca_id) person = await fetchPerson(name, { wcaId: org.wca_id });
      else person = await fetchPerson(name, { countryIso2: org.country_iso2 });

      if (person !== null) {
        if (!newContest.organizers.some((el) => el.personId === person.personId)) newContest.organizers.push(person);
      } else if (!notFoundPersonNames.includes(org.name)) {
        notFoundPersonNames.push(org.name);
      }
    }

    if (notFoundPersonNames.length > 0)
      throw new Error(`Organizers with these names were not found: ${notFoundPersonNames.join(', ')}`);

    return newContest;
  };
};

export const useFetchPerson = () => {
  const myFetch = useMyFetch();

  // null means person not found
  return async (
    name: string,
    { wcaId, countryIso2 }: { wcaId?: string; countryIso2?: string },
  ): Promise<IPerson | null> => {
    if (wcaId) {
      const { payload, errors } = await myFetch.get<IWcaPersonDto>(`/persons/${wcaId}`, {
        authorize: true,
        loadingId: null,
      });
      if (errors) throw new Error(errors[0]);
      return payload.person;
    }

    // If a WCA ID wasn't provided, first try looking in the CC database
    const englishNameOnly = name.split('(')[0].trim(); // get rid of the ( and everything after it
    const { payload, errors: e1 } = await myFetch.get(`/persons?name=${englishNameOnly}&exactMatch=true`, {
      loadingId: null,
    });
    if (e1) throw new Error(`Error while fetching person with the name ${name}`);
    if (payload) return payload;

    // If not found, try searching for exact name matches in the WCA database
    // const {
    //   payload: { result: wcaPersonMatches },
    //   errors,
    // } = await myFetch.get(`https://www.worldcubeassociation.org/api/v0/search/users?q=${name}&persons_table=true`, {
    //   loadingId: null,
    // });
    // if (errors) throw new Error(errors[0]);

    // if (wcaPersonMatches.length === 1) {
    //   const { payload: person, errors } = await myFetch.get(`/persons/${wcaPersonMatches[0].wca_id}`, {
    //     authorize: true,
    //     loadingId: null,
    //   });
    //   if (errors) throw new Error(errors[0]);
    //   if (person) return person.person;
    // }

    // If still not found and the country was provided, use that to create a new person with no WCA ID (likely an organization)
    if (countryIso2) {
      const newPerson: IPersonDto = { name, countryIso2 };
      const { payload: person, errors } = await myFetch.post('/persons/no-wcaid', newPerson, { loadingId: null });
      if (errors) throw new Error(errors[0]);
      if (person) return person;
    }

    return null;
  };
};

// Checks if there are any errors, and if not, calls the callback function,
// passing it the result with the best single and average set
export const useCheckErrorsThenSubmit = () => {
  const { changeErrorMessages } = useContext(MainContext);

  return (
    result: IResult,
    event: IEvent,
    persons: IPerson[],
    submitResultCallback: (result: IResult) => void,
    { round, roundFormat }: { round?: IRound; roundFormat?: RoundFormat },
  ) => {
    const tempErrors: string[] = [];

    if (persons.includes(null)) tempErrors.push('Invalid person(s)');
    else if (persons.some((p1, i1) => persons.some((p2, i2) => i1 !== i2 && p1.personId === p2.personId)))
      tempErrors.push('You cannot enter the same person twice');

    for (let i = 0; i < result.attempts.length; i++) {
      if (result.attempts[i].result === null || result.attempts[i].memo === null) {
        tempErrors.push(`Attempt ${i + 1} is invalid`);
      }
    }

    if (tempErrors.length > 0) {
      changeErrorMessages(tempErrors);
    } else {
      const { best, average } = getBestAndAverage(result.attempts, event, { round, roundFormat });
      result.best = best;
      result.average = average;

      submitResultCallback(result);
    }
  };
};

export const useLimitRequests = (): [(callback: () => void) => void, boolean] => {
  const [fetchTimer, setFetchTimer] = useState<NodeJS.Timeout | null>(null);

  return [
    (callback: () => void) => {
      if (fetchTimer !== null) clearTimeout(fetchTimer);

      setFetchTimer(
        setTimeout(async () => {
          await callback();
          // Resetting this AFTER the callback, so that the fetch request can complete first
          setFetchTimer(null);
        }, C.fetchThrottleTimeout),
      );
    },
    fetchTimer !== null,
  ];
};
