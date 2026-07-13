"use server";

import { and, eq } from "drizzle-orm";
import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import z from "zod";
import { C } from "~/helpers/constants.ts";
import { getDefaultRegions } from "~/helpers/default-regions.ts";
import { getDefaultOrgSettings } from "~/helpers/default-settings.ts";
import type { ContestApiKey, ContestApiKeyMetadata } from "~/helpers/types.ts";
import { arrayElementsSame, fetchWcaPerson, getActionError, getHasRole } from "~/helpers/utility-functions.ts";
import { WcaIdValidator } from "~/helpers/validators/Validators.ts";
import { auth } from "~/server/auth.ts";
import { db } from "~/server/db/provider.ts";
import { membersTable, type usersTable as table } from "~/server/db/schema/auth-schema.ts";
import { memberRequestsTable } from "~/server/db/schema/member-requests";
import { type PersonResponse, personsPublicCols, personsTable, type SelectPerson } from "~/server/db/schema/persons.ts";
import { type InsertRecordConfig, recordConfigsTable } from "~/server/db/schema/record-configs.ts";
import { regionsTable } from "~/server/db/schema/regions.ts";
import { settingsTable } from "~/server/db/schema/settings.ts";
import { sendEmail, sendMemberRequestSubmittedEmail, sendMemberRolesChangedEmail } from "~/server/email/mailer.ts";
import { type OrganizationRole, OrganizationRoles, requestableRoles } from "~/server/organization-permissions.ts";
import { actionClient, RrActionError } from "~/server/safeAction.ts";
import { deletePersonSF, updatePersonSF } from "~/server/server-functions/person-server-functions.ts";
import {
  getMemberRequestDetails,
  getOrCreatePersonByWcaId,
  getRecordConfigsSet,
  logMessage,
} from "~/server/server-only-functions/server-only-functions.ts";

export const sendDebugEmailSF = actionClient
  .metadata({ auth: { useOrganization: false, role: "admin" } })
  .inputSchema(z.strictObject({ emailAddress: z.email() }))
  .action(async ({ parsedInput: { emailAddress } }) => {
    sendEmail(emailAddress, "Debug email", "This is a debug email for testing. You can safely ignore this.");
  });

export const logUserDeletedSF = actionClient
  .metadata({ auth: { useOrganization: false } })
  .inputSchema(
    z.strictObject({
      id: z.string().nonempty(),
    }),
  )
  .action(async ({ parsedInput: { id } }) => {
    logMessage("RR0034", `Deleting user with ID ${id}`);
  });

export const updateMemberSF = actionClient
  .metadata({ auth: { useOrganization: true, orgPermissions: { member: ["update"] } } })
  .inputSchema(
    z.strictObject({
      id: z.string(),
      personId: z.int().min(1).nullable().default(null),
      roles: z
        .enum(OrganizationRoles)
        .array()
        .nonempty()
        .refine((val) => val.includes("member") || val.includes("owner"), { error: "The member role is required" }),
    }),
  )
  .action<{ member: typeof membersTable.$inferSelect; person?: PersonResponse }>(
    async ({ parsedInput: { id, personId, roles }, ctx: { session, httpHeaders } }) => {
      logMessage(
        "RR0033",
        `Updating member with ID ${id} (new person ID: ${personId}; new roles: ${roles.join(", ")})`,
      );

      const [member, credentialAccount] = await Promise.all([
        db.query.members.findFirst({
          with: { user: { columns: { name: true, email: true, emailVerified: true } } },
          where: { organizationId: session.organization!.id, id },
        }),
        db.query.accounts.findFirst({ columns: { id: true }, where: { userId: id, providerId: "credential" } }),
      ]);
      if (!member) throw new RrActionError("Member not found");
      if (!process.env.VITEST && credentialAccount && !member.user.emailVerified)
        throw new RrActionError("The user hasn't verified their email address yet");

      let person: PersonResponse | undefined;
      if (personId) {
        person = (
          await db
            .select(personsPublicCols)
            .from(personsTable)
            .where(and(eq(personsTable.organizationId, session.organization!.id), eq(personsTable.id, personId)))
            .limit(1)
        ).at(0);
        if (!person) throw new RrActionError(`Person with ID ${personId} not found`);
      } else if (
        roles.some((role) =>
          (["mod", "admin", "videoBasedResultReviewer"] satisfies OrganizationRole[]).includes(role as any),
        )
      ) {
        throw new RrActionError("Privileged members must have a person tied to their profile");
      }
      if (roles.includes("owner") && !getHasRole("owner", member.role))
        throw new RrActionError("Assigning the owner role is currently not supported");

      if (!arrayElementsSame(member.role!.split(","), roles)) {
        await changeMemberRoles({
          memberId: id,
          roles,
          personName: person?.name,
          user: member.user,
          organization: session.organization!,
          httpHeaders,
        });
      }

      const [updatedMember] = await db
        .update(membersTable)
        .set({ personId })
        .where(eq(membersTable.id, id))
        .returning();

      return { member: updatedMember, person };
    },
  );

export const linkWcaProfileSF = actionClient
  .metadata({ auth: { useOrganization: true } })
  .action<PersonResponse>(async ({ ctx: { session, httpHeaders } }) => {
    const wcaAccount = await db.query.accounts.findFirst({
      columns: { accountId: true },
      where: { userId: session.user.id, providerId: "wca" },
    });
    if (!wcaAccount) throw new RrActionError("Only users using WCA login can link their own WCA competitor profiles");
    if (!session.organization) throw new RrActionError("Please activate a space first");

    const res = await auth.api.accountInfo({ query: { accountId: wcaAccount.accountId }, headers: httpHeaders });
    if (!res) throw new RrActionError("Unable to retrieve account information from the WCA");

    const parsed = z
      // This doesn't include the full schema of the user information the WCA returns
      .object({
        preferred_username: WcaIdValidator, // if the WCA user has no WCA ID, this will throw a validation error
      })
      .safeParse(res.data);
    if (!parsed.success) throw new RrActionError(z.prettifyError(parsed.error));

    const wcaId = parsed.data.preferred_username;
    let person: PersonResponse | undefined;

    if (session.member!.personId) {
      // Sync existing person
      const existingPerson = await db.query.persons.findFirst({
        columns: { wcaId: true },
        where: { id: session.member!.personId, wcaId },
      });
      if (!existingPerson) throw new RrActionError("Person not found. Please contact the admin team.");

      const wcaPerson = await fetchWcaPerson(wcaId);
      if (!wcaPerson) throw new RrActionError(`Person with WCA ID ${wcaId} not found in the WCA API`);

      const res = await updatePersonSF({ id: session.member!.personId, newPersonDto: wcaPerson });

      if (res.serverError || res.validationErrors) throw new RrActionError(getActionError(res));
      person = res.data!;
    } else {
      // Create new person
      person = (
        await getOrCreatePersonByWcaId(wcaId, {
          creatorUserId: session.user.id,
          organization: session.organization,
        })
      ).person;
    }

    try {
      await db.update(membersTable).set({ personId: person.id }).where(eq(membersTable.id, session.member!.id));
    } catch {
      throw new RrActionError(
        "Error while linking competitor profile. This competitor may already be tied to another user. Please contact the admin team.",
      );
    }

    return person;
  });

export const createOrUpdateMemberRequestSF = actionClient
  .metadata({ auth: { useOrganization: true } })
  .inputSchema(
    z.strictObject({
      requestedPersonId: z.int().nullable(),
      requestedRole: z.enum(requestableRoles).nullable(),
      comment: z.string().nonempty().nullable(),
    }),
  )
  .action(async ({ parsedInput: { requestedPersonId, requestedRole, comment }, ctx: { session } }) => {
    if (!requestedPersonId && !requestedRole && !comment) throw new RrActionError("You cannot submit an empty request");
    if (requestedRole && !requestedPersonId && !session.member!.personId)
      throw new RrActionError("To request a role you must also request a competitor profile");
    if (requestedRole && session.member!.role !== "member")
      throw new RrActionError("You already have a role. Please contact the admin team if you would like to change it.");

    const memberRequest = await db.query.memberRequests.findFirst({ where: { memberId: session.member!.id } });
    if (memberRequest?.requestedPersonId && requestedPersonId !== memberRequest.requestedPersonId) {
      throw new RrActionError(
        "You cannot change your requested person. If you made a mistake before, please delete your request and submit again.",
      );
    }

    logMessage(
      "RR0037",
      `${memberRequest ? "Updating" : "Creating"} member request for member with ID ${session.member!.id}: person ID ${requestedPersonId}, role ${requestedRole}, comment ${comment}`,
    );

    let person: SelectPerson | undefined;
    if (requestedPersonId !== null) {
      if (session.member!.personId)
        throw new RrActionError("There is already a competitor profile linked to your member profile");

      person = await db.query.persons.findFirst({
        where: { organizationId: session.organization!.id, id: requestedPersonId },
      });
      if (!person) throw new RrActionError(`Person with ID ${requestedPersonId} not found`);

      const memberWithSamePerson = await db.query.members.findFirst({
        columns: { personId: true },
        where: { personId: requestedPersonId },
      });
      if (memberWithSamePerson) {
        throw new RrActionError(
          "The requested competitor profile is already claimed. If this is a mistake, please contact the admin team.",
        );
      }
    }

    await db
      .insert(memberRequestsTable)
      .values({ memberId: session.member!.id, requestedPersonId, requestedRole, comment })
      .onConflictDoUpdate({
        target: memberRequestsTable.memberId,
        set: { requestedPersonId, requestedRole, comment },
      });

    // If it's a new request, send an email notification
    if (!memberRequest) {
      sendMemberRequestSubmittedEmail(session.user.email, {
        name: session.user.name,
        requestedPerson: person,
        requestedRole,
        comment,
        organization: session.organization!,
      });
    }

    return await getMemberRequestDetails({ member: session.member! });
  });

export const approveMemberRequestSF = actionClient
  .metadata({ auth: { useOrganization: true, orgPermissions: { memberRequests: ["approve"] } } })
  .inputSchema(z.int())
  .action(async ({ parsedInput: id, ctx: { session, httpHeaders } }) => {
    const memberRequest = await db.query.memberRequests.findFirst({
      with: {
        user: { columns: { name: true, email: true } },
        requestedPerson: { columns: { name: true, approved: true } },
      },
      where: { member: { organizationId: session.organization!.id }, id },
    });
    if (!memberRequest) throw new RrActionError("Member request not found");
    if (memberRequest.requestedPerson?.approved === false)
      throw new RrActionError("Please review and approve the competitor profile on the manage competitors page first");

    if (memberRequest.requestedRole) {
      await changeMemberRoles({
        memberId: memberRequest.memberId,
        roles: [memberRequest.requestedRole],
        personName: memberRequest.requestedPerson?.name,
        user: memberRequest.user,
        organization: session.organization!,
        httpHeaders,
      });
    }

    await db.transaction(async (tx) => {
      if (memberRequest.requestedPersonId) {
        await tx
          .update(membersTable)
          .set({ personId: memberRequest.requestedPersonId })
          .where(eq(membersTable.id, memberRequest.memberId));
      }

      await tx.delete(memberRequestsTable).where(eq(memberRequestsTable.id, id));
    });

    sendEmail(memberRequest.user.email, "Member request approved", "Your member request has been approved.");
  });

export const deleteMemberRequestSF = actionClient
  .metadata({ auth: { useOrganization: true } })
  .inputSchema(z.int())
  .action(async ({ parsedInput: id, ctx: { session, httpHeaders } }) => {
    logMessage("RR0038", `Deleting member request for user with ID ${session.user.id}`);

    const { success: canDeleteMemberRequests } = await auth.api.hasPermission({
      headers: httpHeaders,
      body: { permissions: { memberRequests: ["delete"] } },
    });

    const memberRequest = await db.query.memberRequests.findFirst({
      with: { user: { columns: { email: true } } },
      where: { member: { organizationId: session.organization!.id }, id },
    });
    if (!memberRequest) throw new RrActionError("Member request not found");
    if (memberRequest.memberId !== session.member?.id && !canDeleteMemberRequests)
      throw new RrActionError("You are unauthorized to delete this request");

    // Delete competitor profile, if it was simply created by the user and isn't used anywhere else
    if (memberRequest.requestedPersonId) {
      try {
        await deletePersonSF({ id: memberRequest.requestedPersonId });
      } catch (err) {
        if (!(err instanceof RrActionError)) throw err;
      }
    }

    await db.delete(memberRequestsTable).where(eq(memberRequestsTable.id, id));

    if (memberRequest.memberId !== session.member?.id) {
      sendEmail(
        memberRequest.user.email,
        "Member request rejected",
        "Your member request has been rejected by the admin team.",
      );
    }
  });

export const createOrganizationSF = actionClient
  .metadata({ auth: { useOrganization: false } })
  .inputSchema(
    z.strictObject({
      name: z.string().nonempty(),
      slug: z
        .string()
        .min(C.minSlugCharacters)
        .max(C.maxSlugCharacters)
        .regex(/^[a-zA-Z0-9_-]+$/, {
          error: "The space ID must only contain letters and numbers or the following characters: _ -",
        }),
      contactEmail: z.email(),
      logo: z.string().optional(),
      homePageDescription: z.string().optional(),
      aboutPageContent: z.string().optional(),
      contestTypes: z.array(z.enum(["comp", "meetup", "online"])).nonempty(),
      isPrivate: z.boolean(),
    }),
  )
  .action<{ slug: string }>(
    async ({
      parsedInput: { name, slug, contactEmail, logo, homePageDescription, aboutPageContent, contestTypes, isPrivate },
      ctx: { session, httpHeaders },
    }) => {
      if (process.env.NEXT_PUBLIC_MULTITENANCY_ENABLED !== "true")
        throw new RrActionError("Multitenancy is disabled for this instance");

      const organization = await auth.api.createOrganization({
        body: {
          name,
          slug,
          logo,
          metadata: {
            private: isPrivate,
            contactEmail,
            showDonationLinks: true,
          },
        },
        headers: httpHeaders,
      });

      // Generate regions, settings and record configs
      await db.transaction(async (tx) => {
        await tx.insert(regionsTable).values(getDefaultRegions(organization.id));

        await tx.insert(settingsTable).values(
          getDefaultOrgSettings(organization.id).map((s) => {
            if (s.key === "contest-types") s.value = contestTypes.join(",");
            if (homePageDescription && s.key === "home-page-description") s.value = homePageDescription;
            if (aboutPageContent && s.key === "about-page-content") s.value = aboutPageContent;
            return s;
          }),
        );

        const recordConfigs: InsertRecordConfig[] = [];
        for (const contestType of contestTypes) {
          recordConfigs.push(
            ...getRecordConfigsSet({
              organizationId: organization.id,
              category: contestType === "online" ? "online" : contestType === "meetup" ? "meetups" : "competitions",
              prefix: contestType === "online" ? "O" : contestType === "meetup" ? "M" : "",
            }),
          );
        }
        return await db.insert(recordConfigsTable).values(recordConfigs);
      });

      if (process.env.NEXT_PUBLIC_MULTITENANCY_ENABLED === "true" && process.env.INSTANCE_MAINTAINER_EMAIL) {
        sendEmail(
          process.env.INSTANCE_MAINTAINER_EMAIL,
          "New RR space created",
          `A new space has been created by user ${session.user.name}: ${name}. Contact email: ${session.user.email}`,
        );
      }

      return { slug: organization.slug };
    },
  );

export const createApiKeySF = actionClient
  .metadata({
    auth: {
      useOrganization: true,
      orgPermissions: { competitions: ["create", "update"], meetups: ["create", "update"] },
      orgRole: "admin", // this is temporary
    },
  })
  .inputSchema(
    z.strictObject({
      competitionId: z.string().nonempty(),
      keyName: z.string().optional(),
    }),
  )
  .action<{ apiKey: ContestApiKey; key: string }>(
    async ({ parsedInput: { competitionId, keyName }, ctx: { session, httpHeaders } }) => {
      const contest = await db.query.contests.findFirst({
        columns: { id: true, competitionId: true },
        where: {
          organizationId: session.organization!.id,
          competitionId,
          state: { in: ["approved", "ongoing"] },
          organizerIds: { arrayContains: [session.member!.personId!] },
        },
      });
      if (!contest) throw new RrActionError("Contest not found or you don't have access to it");

      const apiKey = await auth.api.createApiKey({
        body: {
          configId: "contest_keys",
          userId: session.user.id,
          name: keyName?.trim() || undefined,
          metadata: {
            organizationId: session.organization!.id,
            competitionId,
          } satisfies ContestApiKeyMetadata,
        },
        headers: httpHeaders,
      });
      if (!apiKey) throw new RrActionError("Failed to create API key");

      return {
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          rateLimitMax: apiKey.rateLimitMax,
          createdAt: apiKey.createdAt,
          expiresAt: apiKey.expiresAt,
          metadata: apiKey.metadata,
        },
        key: apiKey.key,
      };
    },
  );

async function changeMemberRoles({
  memberId,
  roles,
  personName,
  user,
  organization,
  httpHeaders,
}: {
  memberId: string;
  roles: OrganizationRole[];
  personName: string | undefined;
  user: Pick<typeof table.$inferSelect, "name" | "email">;
  organization: Pick<typeof auth.$Infer.Organization, "name" | "metadata">;
  httpHeaders: ReadonlyHeaders;
}) {
  await auth.api.updateMemberRole({ headers: httpHeaders, body: { memberId, role: roles } });

  sendMemberRolesChangedEmail(user.email, { organizationName: organization.name, roles });

  if (roles.includes("admin")) {
    sendEmail(
      organization.metadata.contactEmail,
      "Important: New admin member",
      `User ${user.name}${personName ? ` (competitor ${personName})` : ""} has been given the admin role.`,
    );
  }
}
