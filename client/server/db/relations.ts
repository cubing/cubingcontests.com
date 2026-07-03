import "server-only";
import { defineRelations } from "drizzle-orm";
import { postsTable as posts } from "~/server/db/schema/posts.ts";
import { settingsTable as settings } from "~/server/db/schema/settings.ts";
import {
  accountsTable as accounts,
  invitationsTable as invitations,
  membersTable as members,
  organizationsTable as organizations,
  sessionsTable as sessions,
  subscriptionsTable as subscriptions,
  usersTable as users,
  verificationsTable as verifications,
} from "./schema/auth-schema.ts";
import { collectiveSolutionsTable as collectiveSolutions } from "./schema/collective-solutions.ts";
import { contestsTable as contests } from "./schema/contests.ts";
import { eventsTable as events } from "./schema/events.ts";
import { memberRequestsTable as memberRequests } from "./schema/member-requests.ts";
import { personsTable as persons } from "./schema/persons.ts";
import { recordConfigsTable as recordConfigs } from "./schema/record-configs.ts";
import { regionsTable as regions } from "./schema/regions.ts";
import { resultsTable as results } from "./schema/results.ts";
import { roundsTable as rounds } from "./schema/rounds.ts";

export const relations = defineRelations(
  {
    // Better Auth relations
    users,
    sessions,
    accounts,
    verifications,
    organizations,
    members,
    invitations,
    subscriptions,

    // RecordRanks relations
    memberRequests,
    events,
    contests,
    rounds,
    results,
    persons,
    regions,
    recordConfigs,
    collectiveSolutions,
    posts,
    settings,
  },
  (r) => ({
    // Better Auth relations
    users: {
      sessions: r.many.sessions(),
      accounts: r.many.accounts(),
      members: r.many.members(),
      invitations: r.many.invitations(),
    },
    sessions: {
      user: r.one.users({
        from: r.sessions.userId,
        to: r.users.id,
        optional: false,
      }),
    },
    accounts: {
      user: r.one.users({
        from: r.accounts.userId,
        to: r.users.id,
        optional: false,
      }),
    },
    verifications: {},
    organizations: {
      members: r.many.members(),
      invitations: r.many.invitations(),
      subscription: r.one.subscriptions({
        from: r.organizations.id,
        to: r.subscriptions.referenceId,
      }),
    },
    members: {
      organization: r.one.organizations({
        from: r.members.organizationId,
        to: r.organizations.id,
        optional: false,
      }),
      user: r.one.users({
        from: r.members.userId,
        to: r.users.id,
        optional: false,
      }),
      person: r.one.persons({
        from: r.members.personId,
        to: r.persons.id,
      }),
    },
    invitations: {
      organization: r.one.organizations({
        from: r.invitations.organizationId,
        to: r.organizations.id,
        optional: false,
      }),
      inviter: r.one.users({
        from: r.invitations.inviterId,
        to: r.users.id,
        optional: false,
      }),
    },

    // RecordRanks relations
    memberRequests: {
      member: r.one.members({
        from: r.memberRequests.memberId,
        to: r.members.id,
        optional: false,
      }),
      user: r.one.users({
        from: r.memberRequests.memberId.through(r.members.id),
        to: r.users.id.through(r.members.userId),
        optional: false,
      }),
      requestedPerson: r.one.persons({
        from: r.memberRequests.requestedPersonId,
        to: r.persons.id,
      }),
    },
    contests: {
      // Relevant issue: https://github.com/drizzle-team/drizzle-orm/issues/4988
      // organizers: r.many.persons({
      //   from: r.contests.organizerIds,
      //   to: r.persons.id,
      // }),
      creator: r.one.users({
        from: r.contests.createdBy,
        to: r.users.id,
      }),
    },
    rounds: {
      results: r.many.results(),
    },
    results: {
      // persons: r.many.persons({
      //   from: r.results.personIds,
      //   to: r.persons.id,
      //   where: { id: { in: r.results.personIds } },
      // }),
      round: r.one.rounds({
        from: r.results.roundId,
        to: r.rounds.id,
      }),
      creator: r.one.users({
        from: r.results.createdBy,
        to: r.users.id,
      }),
    },
    persons: {
      member: r.one.members(),
      creator: r.one.users({
        from: r.persons.createdBy,
        to: r.users.id,
      }),
    },
    collectiveSolutions: {
      lastUserWhoInteracted: r.one.users({
        from: r.collectiveSolutions.lastUserWhoInteractedId,
        to: r.users.id,
      }),
    },
    posts: {
      author: r.one.users({
        from: r.posts.createdBy,
        to: r.users.id,
      }),
    },
  }),
);
