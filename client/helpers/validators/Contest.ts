import { getTimezoneOffset } from "date-fns-tz";
import z from "zod";
import { C, IS_CUBING_CONTESTS_INSTANCE } from "~/helpers/constants.ts";
import type { Activity } from "~/helpers/types/Schedule.ts";
import { ContestTypeValues } from "~/helpers/types.ts";
import { getDateOnly } from "~/helpers/utility-functions.ts";
import { ColorValidator, RegionCodeValidator } from "~/helpers/validators/Validators.ts";

const ActivityValidator = z.lazy((): any =>
  z
    .strictObject({
      id: z.int().min(1),
      activityCode: z.string().regex(/^[a-z0-9][a-z0-9-_]{2,}$/),
      name: z.string().nonempty().optional(), // only set when activityCode = other-misc (see superRefine() below)
      startTime: z.coerce.date(),
      endTime: z.coerce.date(),
      // childActivities: z.array(ActivityValidator), // TO-DO!!!!!!!!!!!!!!!!!!!!
      childActivities: z.array(z.never()).max(0),
    })
    .superRefine((val, ctx) => {
      if (val.activityCode === "other-misc" && !val.name) {
        ctx.addIssue({
          code: "custom",
          message: "A custom activity must have a custom title",
          input: val.name,
        });
      } else if (val.activityCode !== "other-misc" && val.name) {
        ctx.addIssue({
          code: "custom",
          message: "A non-custom activity may not have a custom title",
          input: val.name,
        });
      }
    }),
);

const RoomValidator = z.strictObject({
  id: z.int().min(1),
  name: z.string().nonempty(),
  color: ColorValidator,
  activities: z
    .array(ActivityValidator)
    .nonempty({ error: "Please create at least one activity" })
    .superRefine((val, ctx) => {
      const duplicateFoundObj = { id: false, activityCode: false };

      const checkActivityDuplicates = (activities: Activity[], key: "id" | "activityCode") => {
        for (let i = 0; i < activities.length; i++) {
          for (let j = i + 1; j < activities.length; j++) {
            if (
              activities[i][key] === activities[j][key] &&
              (key === "id" || activities[i].name === activities[j].name)
            ) {
              duplicateFoundObj[key] = true;
            }
          }
          if (!duplicateFoundObj[key]) activities.forEach((a) => void checkActivityDuplicates(a.childActivities, key));
        }
      };

      checkActivityDuplicates(val, "id");
      checkActivityDuplicates(val, "activityCode");

      if (duplicateFoundObj.id) {
        ctx.addIssue({
          code: "custom",
          message: "Activities must not have duplicate IDs",
        });
      }
      if (duplicateFoundObj.activityCode) {
        ctx.addIssue({
          code: "custom",
          message: "Activities must not have duplicate activity codes",
        });
      }
    }),
});

const latitudeMicrodegrees = z
  .int()
  .min(-90000000, { error: "The latitude cannot be less than -90 degrees" })
  .max(90000000, { error: "The latitude cannot be more than 90 degrees" });
const longitudeMicrodegrees = z
  .int()
  .min(-180000000, { error: "The longitude cannot be less than -180 degrees" })
  .max(180000000, { error: "The longitude cannot be more than 180 degrees" });
const duplicateIdsCheck = (val: any[]) => val.length === new Set(val.map((v) => v.id)).size;

const VenueValidator = z.strictObject({
  id: z.int().min(1),
  name: z.string().nonempty(),
  countryIso2: RegionCodeValidator,
  latitudeMicrodegrees,
  longitudeMicrodegrees,
  timezone: z.string().nonempty(),
  rooms: z
    .array(RoomValidator)
    .nonempty({ error: "Please create at least one room" })
    .refine(duplicateIdsCheck, { error: "Venue rooms must not have duplicate IDs" }),
});

const ScheduleValidator = z.strictObject({
  venues: z
    .array(VenueValidator)
    .nonempty({ error: "Please create at least one venue" })
    .refine(duplicateIdsCheck, { error: "Schedule venues must not have duplicate IDs" }),
});

export const ContestValidator = z
  .strictObject({
    competitionId: z
      .string()
      .min(4)
      .regex(/^[a-zA-Z0-9]*$/, { error: "The contest ID must only contain alphanumeric characters" }),
    name: z
      .string()
      .min(IS_CUBING_CONTESTS_INSTANCE ? 10 : 5)
      .refine((val) => !IS_CUBING_CONTESTS_INSTANCE || /.* [0-9]{4}$/.test(val), {
        error: "The contest name must have the year at the end, separated by a space",
      }),
    shortName: z
      .string()
      .min(IS_CUBING_CONTESTS_INSTANCE ? 8 : 3)
      .max(C.maxContestShortName)
      .refine((val) => !IS_CUBING_CONTESTS_INSTANCE || /.* [0-9]{4}$/.test(val), {
        error: "The short name must have the year at the end, separated by a space",
      }),
    type: z.enum(ContestTypeValues),
    city: z.string().nonempty(),
    regionCode: RegionCodeValidator,
    venue: z.string(),
    address: z.string(),
    latitudeMicrodegrees,
    longitudeMicrodegrees,
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    startTime: z.coerce.date().nullable(),
    timezone: z.string().nonempty().nullable(),
    organizerIds: z
      .array(z.int())
      .nonempty()
      .refine((val) => val.length === new Set(val).size, { error: "List of organizers must not have duplicates" }),
    contact: z.email().nullable(),
    description: z.string().nullable(),
    competitorLimit: z.int().min(C.minCompetitorLimit),
    schedule: ScheduleValidator.nullable(),
  })
  .superRefine((val, ctx) => {
    for (const key of ["competitionId", "name", "shortName"]) {
      if (IS_CUBING_CONTESTS_INSTANCE) {
        if (
          val.type !== "wca-comp" &&
          (/championship/i.test((val as any)[key]) || /national/i.test((val as any)[key]))
        ) {
          ctx.addIssue({
            code: "custom",
            message: 'The name must not contain "championship" or "national"',
            input: (val as any)[key],
          });
        }

        if (val.type === "meetup" && /open/i.test((val as any)[key])) {
          ctx.addIssue({
            code: "custom",
            message: 'The name must not contain "open" (only applies to meetups)',
            input: (val as any)[key],
          });
        }
      }
    }

    if (val.startDate > val.endDate) {
      ctx.addIssue({
        code: "custom",
        message: `The start date (${val.startDate.toDateString()}) must be before the end date (${val.endDate.toDateString()})`,
        input: val.startDate,
      });
    }

    if (val.type !== "online") {
      if (!val.venue || !val.address)
        ctx.addIssue({ code: "custom", message: "Please enter the venue and the address" });
      if (!val.latitudeMicrodegrees || !val.longitudeMicrodegrees)
        ctx.addIssue({ code: "custom", message: "Please enter the coordinates of the venue" });
    }

    if (val.type === "meetup") {
      const correctStartDate = getDateOnly(new Date(val.startTime!.getTime() + getTimezoneOffset(val.timezone!)))!;
      if (val.startDate.getTime() !== correctStartDate.getTime()) {
        ctx.addIssue({
          code: "custom",
          message: `Mismatch between startDate (${val.startDate.toDateString()}) and startTime (${correctStartDate.toDateString()}). Please report this to the admin team.`,
          input: val.startTime,
        });
      }
    }
  });

export type ContestDto = z.infer<typeof ContestValidator>;
