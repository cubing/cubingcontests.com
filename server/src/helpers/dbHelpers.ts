export const exclSysButKeepCreatedBy = {
  __v: 0,
  createdAt: 0,
  updatedAt: 0,
};

export const excl = {
  ...exclSysButKeepCreatedBy,
  // THIS IS NOT A MONGO DB FIELD. It's a field used mostly by the CC backend, so it must be excluded for all requests,
  // unless explicitly needed on the frontend to be displayed to an authorized user.
  createdBy: 0,
};

export const orgPopulateOptions = { path: 'organizers', model: 'Person' };

const rounds = {
  path: 'events.rounds',
  model: 'Round',
};

export const eventPopulateOptions = {
  event: { path: 'events.event', model: 'Event' },
  rounds,
  roundsAndResults: {
    ...rounds,
    populate: [
      {
        path: 'results',
        model: 'Result',
      },
    ],
  },
};
