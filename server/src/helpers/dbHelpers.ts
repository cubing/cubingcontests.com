export const exclSysButKeepCreatedBy = {
  __v: 0,
  createdAt: 0,
  updatedAt: 0,
};

export const excl = {
  ...exclSysButKeepCreatedBy,
  // THIS IS NOT A MONGO DB FIELD. It's a field used purely by the CC backend, so it must be excluded for all requests.
  createdBy: 0,
};

export const orgPopulateOptions = { path: 'organizers', model: 'Person' };

export const eventPopulateOptions = {
  event: { path: 'events.event', model: 'Event' },
  rounds: {
    path: 'events.rounds',
    model: 'Round',
    populate: [
      {
        path: 'results',
        model: 'Result',
      },
    ],
  },
};
