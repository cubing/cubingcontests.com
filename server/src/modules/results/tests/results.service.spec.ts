import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { C } from "~/helpers/constants";
import { MyLogger } from "~/src/modules/my-logger/my-logger.service";
import { EventsService } from "@m/events/events.service";
import { ResultsService } from "@m/results/results.service";
import { RecordTypesService } from "@m/record-types/record-types.service";
import { PersonsService } from "@m/persons/persons.service";
import { AuthService } from "@m/auth/auth.service";
import { UsersService } from "@m/users/users.service";
import { EmailService } from "@m/email/email.service";
import { Role, WcaRecordType } from "~/helpers/enums";
import { IEventRankings } from "~/helpers/types";
import { IPartialUser } from "~/helpers/types";

// Mocks and stubs
import { MyLoggerMock } from "~/src/modules/my-logger/tests/my-logger.service";
import { EventsServiceMock } from "@m/events/tests/mocks/events.service";
import {
  RecordTypesServiceMock,
  setEventAvgRecordsMock,
  setEventSingleRecordsMock,
} from "@m/record-types/tests/mocks/record-types.service";
import { PersonsServiceMock } from "@m/persons/tests/mocks/persons.service";
import { ResultModelMock } from "@m/results/tests/mocks/result.model";
import { RoundModelMock } from "~/src/modules/contests/tests/mocks/round.model";
import { ContestModelMock } from "~/src/modules/contests/tests/mocks/contest.model";
import { AuthServiceMock } from "@m/auth/tests/mocks/auth.service";
import { CreateResultDto } from "../dto/create-result.dto";
import { CreateVideoBasedResultDto } from "~/src/modules/results/dto/create-video-based-result.dto";
import { resultsStub } from "~/src/modules/results/tests/stubs/results.stub";
import { eventsStub } from "~/src/modules/events/tests/stubs/events.stub";

const adminUser: IPartialUser = {
  personId: 1,
  username: "adminuser",
  email: "admin@example.com",
  roles: [Role.Admin],
};
const modUser: IPartialUser = {
  personId: 2,
  username: "moduser",
  email: "mod@example.com",
  roles: [Role.Moderator],
};

describe("ResultsService", () => {
  let resultsService: ResultsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultsService,
        {
          provide: MyLogger,
          useFactory: MyLoggerMock,
        },
        {
          provide: EventsService,
          useFactory: EventsServiceMock,
        },
        {
          provide: RecordTypesService,
          useFactory: RecordTypesServiceMock,
        },
        {
          provide: PersonsService,
          useFactory: PersonsServiceMock,
        },
        {
          provide: AuthService,
          useFactory: AuthServiceMock,
        },
        {
          provide: UsersService,
          useValue: {},
        },
        {
          provide: EmailService,
          useValue: {},
        },
        {
          provide: getModelToken("Result"),
          useFactory: ResultModelMock,
        },
        {
          provide: getModelToken("Round"),
          useFactory: RoundModelMock,
        },
        {
          provide: getModelToken("Competition"),
          useFactory: ContestModelMock,
        },
        {
          provide: getModelToken("Schedule"),
          useValue: {},
        },
      ],
    }).compile();

    resultsService = module.get<ResultsService>(ResultsService);
  });

  describe("Endpoints", () => {
    it("gets current records", async () => {
      const eventRecords = await resultsService.getRecords(WcaRecordType.WR);
      const records333 = eventRecords.find((el: IEventRankings) => el.event.eventId === "333");
      const records333fm = eventRecords.find((el: IEventRankings) => el.event.eventId === "333fm");

      // Check 3x3x3 records
      expect(records333.rankings.length).toBe(2);
      expect(records333.rankings[0].result).toBe(909); // single
      expect(records333.rankings[1].result).toBe(1132); // single
      // Check 3x3x3 FM records (they should have a tie)
      expect(records333fm.rankings.length).toBe(3);
      expect(records333fm.rankings[0].result).toBe(39); // single
      expect(records333fm.rankings[1].result).toBe(39); // single
      expect(records333fm.rankings[2].result).toBe(4600); // mean
    });

    describe("createResult", () => {
      // TO-DO: MAKE THIS TEST WORK VIA ACTUAL MOCK DB! it doesn't work anymore due to createResult no longer editing the dto object directly
      // it("creates new 3x3x3 result", async () => {
      //   const newResult: CreateResultDto = {
      //     eventId: "333",
      //     personIds: [99],
      //     attempts: [{ result: 1054 }, { result: 1342 }, { result: 942 }, { result: 999 }, { result: 1115 }],
      //   };

      //   await resultsService.createResult("Munich19022023", "333-r1", newResult, { user: adminUser });
      //   const createdResult = newResult as ResultDocument; // createResult directly edits newResult

      //   expect(createdResult.regionalSingleRecord).toBe("WR");
      //   expect(createdResult.regionalAverageRecord).toBe("WR");
      // });

      it("throws an error when one of the competitors already has a result in the round", async () => {
        const new333Result: CreateResultDto = {
          eventId: "333",
          personIds: [1],
          attempts: [{ result: 1568 }, { result: 2054 }, { result: 1911 }, {
            result: 1723,
          }, { result: 1489 }],
        };

        await expect(
          resultsService.createResult(
            "Munich19022023",
            "333-r1",
            new333Result,
            { user: adminUser },
          ),
        ).rejects
          .toThrow(
            new BadRequestException(
              "The competitor(s) already has a result in this round",
            ),
          );

        const newTeamBldResult: CreateResultDto = {
          eventId: "333_team_bld",
          personIds: [99, 2],
          attempts: [{ result: 4085 }, { result: 5942 }, { result: 3309 }, {
            result: 3820,
          }, { result: 4255 }],
        };

        await expect(
          resultsService.createResult(
            "Munich19022023",
            "333_team_bld-r1",
            newTeamBldResult,
            { user: adminUser },
          ),
        ).rejects.toThrow(
          new BadRequestException(
            "The competitor(s) already has a result in this round",
          ),
        );
      });

      it("throws an error when the round is not found", async () => {
        await expect(
          resultsService.createResult(
            "Munich19022023",
            "333-INVALID_ROUND_NUMBER",
            { eventId: "333" } as CreateResultDto,
            { user: adminUser },
          ),
        ).rejects.toThrow(
          new BadRequestException(
            "Round ID has invalid round number: 333-INVALID_ROUND_NUMBER",
          ),
        );
      });

      it("throws an error when the number of competitors in the result is wrong", async () => {
        await expect(
          resultsService.createResult(
            "Munich19022023",
            "333-r1",
            { eventId: "333", personIds: [123, 124, 125] } as CreateResultDto,
            { user: adminUser },
          ),
        ).rejects.toThrow(
          new BadRequestException("This event must have 1 participant"),
        );
      });
    });

    describe("submitResult", () => {
      it("submits new 4x4x4 Blindfolded result", async () => {
        const newResult: CreateVideoBasedResultDto = {
          eventId: "444bf",
          date: new Date("2024-08-11T00:00:00Z"),
          personIds: [99],
          attempts: [{ result: 10085 }],
          videoLink: "link.com",
        };

        const createdResult = await resultsService.createVideoBasedResult(
          newResult,
          adminUser,
        );

        expect(createdResult.regionalSingleRecord).toBeUndefined();
        expect(createdResult.regionalAverageRecord).toBeUndefined();
      });

      it("throws an error when there is no video link", async () => {
        await expect(
          resultsService.createVideoBasedResult(
            {
              eventId: "444bf",
              date: new Date(),
              personIds: [1],
              attempts: [{ result: 10000 }],
              videoLink: undefined,
            },
            adminUser,
          ),
        ).rejects.toThrow(new BadRequestException("Please enter a video link"));
      });

      it("throws an error when a non-admin submits a result with an empty video link", async () => {
        await expect(
          resultsService.createVideoBasedResult(
            {
              eventId: "444bf",
              date: new Date(),
              personIds: [1],
              attempts: [{ result: 10000 }],
              videoLink: "",
            },
            modUser,
          ),
        ).rejects.toThrow(new BadRequestException("Please enter a video link"));
      });

      it("throws an error when a non-admin submits a result with unknown time", async () => {
        await expect(
          resultsService.createVideoBasedResult(
            {
              eventId: "444bf",
              date: new Date(),
              personIds: [1],
              attempts: [{ result: C.maxTime }],
              videoLink: "link.com",
            },
            modUser,
          ),
        ).rejects.toThrow(
          new BadRequestException("You are not authorized to set unknown time"),
        );
      });
    });

    // describe('updateResult', () => {});

    // describe('deleteResult', () => {});

    describe("updateFutureRecords", () => {
      it("sets future records after editing a Team-Blind result with records to be worse than a future result", async () => {
        const result = resultsStub().find((r) => r._id.toString() === "649fe9c3ecadd98a79f99c45");
        const event = eventsStub().find((e) => e.eventId === result.eventId);
        const recordPairs = await resultsService.getEventRecordPairs(event, {
          recordsUpTo: result.date,
          excludeResultId: result._id.toString(),
        });

        result.best = 3546;
        result.average = 4178;

        await resultsService.updateFutureRecords(result, event, recordPairs, {
          mode: "edit",
          previousBest: 2148,
          previousAvg: 3157,
        });

        const baseQuery = {
          _id: { $ne: result._id },
          date: { $gte: result.date },
          eventId: "333_team_bld",
        };

        expect(setEventSingleRecordsMock).toHaveBeenCalledWith(
          event,
          WcaRecordType.WR,
          {
            ...baseQuery,
            best: { $gt: 0, $lte: 3546 },
          },
        );
        expect(setEventAvgRecordsMock).toHaveBeenCalledWith(
          event,
          WcaRecordType.WR,
          {
            ...baseQuery,
            attempts: { $size: 5 },
            average: { $gt: 0, $lte: 4178 },
          },
        );
      });

      it("sets future records after editing a Team-Blind result with records to be worse", async () => {
        const result = resultsStub().find((r) => r._id.toString() === "649fe9c3ecadd98a79f99c71");
        const event = eventsStub().find((e) => e.eventId === result.eventId);
        const recordPairs = await resultsService.getEventRecordPairs(event, {
          recordsUpTo: result.date,
          excludeResultId: result._id.toString(),
        });

        result.best = 2271;
        result.average = 3418;

        await resultsService.updateFutureRecords(result, event, recordPairs, {
          mode: "edit",
          previousBest: 2044,
          previousAvg: 2531,
        });

        const baseQuery = {
          _id: { $ne: result._id },
          date: { $gte: result.date },
          eventId: "333_team_bld",
        };

        expect(setEventSingleRecordsMock).toHaveBeenCalledWith(
          event,
          WcaRecordType.WR,
          {
            ...baseQuery,
            best: { $gt: 0, $lte: 2148 }, // 21.48 was the single record at the time
          },
        );
        expect(setEventAvgRecordsMock).toHaveBeenCalledWith(
          event,
          WcaRecordType.WR,
          {
            ...baseQuery,
            attempts: { $size: 5 },
            average: { $gt: 0, $lte: 3157 }, // 31.57 was the average record at the time
          },
        );
      });

      it("sets future records after editing a Team-Blind result with records to be worse, but still better than the old records", async () => {
        const result = resultsStub().find((r) => r._id.toString() === "649fe9c3ecadd98a79f99c71");
        const event = eventsStub().find((e) => e.eventId === result.eventId);
        const recordPairs = await resultsService.getEventRecordPairs(event, {
          recordsUpTo: result.date,
          excludeResultId: result._id.toString(),
        });

        result.best = 2130;
        result.average = 2697;

        await resultsService.updateFutureRecords(result, event, recordPairs, {
          mode: "edit",
          previousBest: 2044,
          previousAvg: 2531,
        });

        const baseQuery = {
          _id: { $ne: result._id },
          date: { $gte: result.date },
          eventId: "333_team_bld",
        };

        expect(setEventSingleRecordsMock).toHaveBeenCalledWith(
          event,
          WcaRecordType.WR,
          {
            ...baseQuery,
            best: { $gt: 0, $lte: 2130 },
          },
        );
        expect(setEventAvgRecordsMock).toHaveBeenCalledWith(
          event,
          WcaRecordType.WR,
          {
            ...baseQuery,
            attempts: { $size: 5 },
            average: { $gt: 0, $lte: 2697 },
          },
        );
      });

      it("sets future records after deletion of a Team-Blind result with records", async () => {
        const result = resultsStub().find((r) => r._id.toString() === "649fe9c3ecadd98a79f99c45");
        const event = eventsStub().find((e) => e.eventId === result.eventId);
        const recordPairs = await resultsService.getEventRecordPairs(event, {
          recordsUpTo: result.date,
          excludeResultId: result._id.toString(),
        });

        await resultsService.updateFutureRecords(result, event, recordPairs, {
          mode: "delete",
        });

        const baseQuery = {
          _id: { $ne: result._id },
          date: { $gte: result.date },
          eventId: "333_team_bld",
        };

        expect(setEventSingleRecordsMock).toHaveBeenCalledWith(
          event,
          WcaRecordType.WR,
          {
            ...baseQuery,
            best: { $gt: 0, $lte: 5059 },
          },
        );
        expect(setEventAvgRecordsMock).toHaveBeenCalledWith(
          event,
          WcaRecordType.WR,
          {
            ...baseQuery,
            attempts: { $size: 5 },
            average: { $gt: 0, $lte: 11740 },
          },
        );
      });
    });
  });
});
