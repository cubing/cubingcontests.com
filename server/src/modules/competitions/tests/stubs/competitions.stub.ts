import mongoose from 'mongoose';
import { CompetitionDocument } from '~/src/models/competition.model';

export const competitionsStub = (): CompetitionDocument[] => {
  return [
    {
      _id: new mongoose.Types.ObjectId('649d2a23675dfd951d5ff308'),
      competitionId: 'Munich19022023',
      name: 'Meetup in Munich on February 19, 2023',
      city: 'Munich',
      countryId: 'DE',
      startDate: new Date('2023-02-19T06:49:04Z'),
      endDate: new Date('2023-02-19T06:49:04Z'),
      mainEventId: '333',
      participants: 4,
      events: [
        {
          eventId: '333tbf',
          rounds: [new mongoose.Types.ObjectId('649d2e63675dfd951d5ff360')],
        },
        {
          eventId: '333oh',
          rounds: [new mongoose.Types.ObjectId('649d2e63675dfd951d5ff362')],
        },
        {
          eventId: '333',
          rounds: [new mongoose.Types.ObjectId('649d2e63675dfd951d5ff364')],
        },
        {
          eventId: '333bf',
          rounds: [new mongoose.Types.ObjectId('649d2e63675dfd951d5ff366')],
        },
      ],
      __v: 1,
    },
    {
      _id: new mongoose.Types.ObjectId('649d2a4f675dfd951d5ff319'),
      competitionId: 'Munich14062023',
      name: 'Meetup in Munich on June 14, 2023',
      city: 'Munich',
      countryId: 'DE',
      startDate: new Date('2023-06-14T06:52:26Z'),
      endDate: new Date('2023-06-14T06:52:26Z'),
      mainEventId: '333',
      participants: 5,
      events: [
        {
          eventId: '444',
          rounds: [new mongoose.Types.ObjectId('649d3423675dfd951d5ff3bf')],
        },
        {
          eventId: '555',
          rounds: [new mongoose.Types.ObjectId('649d3423675dfd951d5ff3c1')],
        },
        {
          eventId: '333bf',
          rounds: [new mongoose.Types.ObjectId('649d3423675dfd951d5ff3c3')],
        },
        {
          eventId: '333fm',
          rounds: [new mongoose.Types.ObjectId('649d3423675dfd951d5ff3c5')],
        },
        {
          eventId: '333oh',
          rounds: [new mongoose.Types.ObjectId('649d3423675dfd951d5ff3c7')],
        },
        {
          eventId: '222',
          rounds: [new mongoose.Types.ObjectId('649d3423675dfd951d5ff3c9')],
        },
        {
          eventId: '333',
          rounds: [new mongoose.Types.ObjectId('649d3423675dfd951d5ff3cb')],
        },
      ],
      __v: 1,
    },
    {
      _id: new mongoose.Types.ObjectId('649d2a85675dfd951d5ff32a'),
      competitionId: 'Munich27062023',
      name: 'Meetup in Munich on June 27, 2023',
      city: 'Munich',
      countryId: 'DE',
      startDate: new Date('2023-06-27T06:53:10Z'),
      endDate: new Date('2023-06-27T06:53:10Z'),
      mainEventId: '333',
      participants: 6,
      events: [
        {
          eventId: '666',
          rounds: [new mongoose.Types.ObjectId('649d4cea2770bb25d9918068')],
        },
        {
          eventId: '333tbf',
          rounds: [new mongoose.Types.ObjectId('649d4cea2770bb25d991806a')],
        },
        {
          eventId: '333',
          rounds: [new mongoose.Types.ObjectId('649d4cea2770bb25d991806c')],
        },
        {
          eventId: '333oh',
          rounds: [new mongoose.Types.ObjectId('649d4cea2770bb25d991806e')],
        },
        {
          eventId: '222',
          rounds: [new mongoose.Types.ObjectId('649d4cea2770bb25d9918070')],
        },
        {
          eventId: '444',
          rounds: [new mongoose.Types.ObjectId('649d4cea2770bb25d9918072')],
        },
        {
          eventId: '333bf',
          rounds: [new mongoose.Types.ObjectId('649d4cea2770bb25d9918074')],
        },
        {
          eventId: '333tf',
          rounds: [new mongoose.Types.ObjectId('649d4cea2770bb25d9918076')],
        },
        {
          eventId: '555',
          rounds: [new mongoose.Types.ObjectId('649d4cea2770bb25d9918078')],
        },
        {
          eventId: '333fm',
          rounds: [new mongoose.Types.ObjectId('649d4cea2770bb25d991807a')],
        },
      ],
      __v: 1,
    },
    {
      _id: new mongoose.Types.ObjectId('649d4ff8a91cfa4672e186fe'),
      competitionId: 'Munich30062023',
      name: 'Meetup in Munich on June 30, 2023',
      city: 'Munich',
      countryId: 'DE',
      startDate: new Date('2023-06-30T09:33:18Z'),
      endDate: new Date('2023-06-30T09:33:18Z'),
      mainEventId: '333',
      participants: 0,
      events: [],
      __v: 0,
    } as CompetitionDocument, // for some reason Typescript doesn't like this competition without type casting
  ] as CompetitionDocument[];
};
