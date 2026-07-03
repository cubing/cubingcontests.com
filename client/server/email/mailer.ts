import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import Handlebars from "handlebars";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer/index";
import { C } from "~/helpers/constants.ts";
import { videoBasedFormats } from "~/helpers/roundFormats.ts";
import type { OrganizationDetails } from "~/helpers/types.ts";
import { getFormattedTime, getIsUrgent } from "~/helpers/utility-functions.ts";
import type { SelectContest } from "~/server/db/schema/contests.ts";
import type { SelectPerson } from "~/server/db/schema/persons.ts";
import { nodemailerConnectionOptions } from "~/server/email/connection-options.ts";
import { type LogCode, LogCodes } from "~/server/logger.ts";
import { orgRolesObject } from "~/server/organization-permissions.ts";
import { getSettingFromDb, logMessage } from "~/server/server-only-functions.ts";
import type { SelectEvent } from "../db/schema/events.ts";
import type { ResultResponse } from "../db/schema/results.ts";

// This is needed when running Better Auth DB migrations
if (process.env.NODE_ENV !== "production") loadEnvConfig(process.cwd(), true);

if (!process.env.PROD_HOSTNAME) console.error("PROD_HOSTNAME environment variable not set!");
if (!process.env.NEXT_PUBLIC_BASE_URL) console.error("NEXT_PUBLIC_BASE_URL environment variable not set!");

const transporter = nodemailer.createTransport(nodemailerConnectionOptions);

const noReplyEmail: Mail.Address = {
  name: "No Reply",
  address: `no-reply@${process.env.PROD_HOSTNAME}`,
};
const contestsEmail: Mail.Address = {
  name: "Contests",
  address: `contests@${process.env.PROD_HOSTNAME}`,
};
const resultsEmail: Mail.Address = {
  name: "Results",
  address: `results@${process.env.PROD_HOSTNAME}`,
};
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
const projectName = process.env.NEXT_PUBLIC_PROJECT_NAME!;

async function send({
  templateFileName = "default.hbs",
  context,
  callback,
}: {
  templateFileName?: string;
  context: Record<string, string | number | boolean>;
  callback: (html: string) => Promise<void>;
}) {
  if (process.env.VITEST) return;
  if (!process.env.EMAIL_HOST) {
    if (process.env.NODE_ENV === "production")
      console.warn("Warning: Not sending email, because EMAIL_HOST environment variable isn't set!");
    return;
  }

  try {
    const currFilePath = import.meta.url.replace(/^file:/, "");
    const templateContents = await readFile(join(currFilePath, "../templates", templateFileName), "utf-8");
    const template = Handlebars.compile(templateContents, { strict: true });
    const html = template(context);

    await callback(html);
  } catch (err) {
    logMessage("RR5001", `Error while sending email with template ${templateFileName}: ${err}`);
  }
}

/////////////////////
// Email functions //
/////////////////////

export function sendEmail(to: string, subject: string, content: string) {
  send({
    context: {
      projectName,
      content,
    },
    callback: async (html) => {
      await transporter.sendMail({
        from: noReplyEmail,
        to,
        subject,
        html,
      });
    },
  });
}

export function sendErrorEmail(to: string, errorCode: LogCode, errorMessage: string) {
  send({
    templateFileName: "error.hbs",
    context: {
      projectName,
      errorMessage,
      errorCode,
      errorCodeDescription: LogCodes[errorCode],
    },
    callback: async (html) => {
      await transporter.sendMail({
        from: noReplyEmail,
        to,
        subject: "Website error",
        html,
      });
    },
  });
}

export function sendVerificationEmail(to: string, url: string) {
  send({
    templateFileName: "email-verification.hbs",
    context: {
      baseUrl,
      projectName,
      verificationLink: url,
    },
    callback: async (html) => {
      await transporter.sendMail({
        from: noReplyEmail,
        to,
        subject: "Email verification",
        html,
      });
    },
  });
}

export function sendResetPasswordEmail(to: string, url: string) {
  send({
    templateFileName: "password-reset-request.hbs",
    context: {
      baseUrl,
      projectName,
      passwordResetLink: url,
    },
    callback: async (html) => {
      await transporter.sendMail({
        from: noReplyEmail,
        to,
        subject: "Password reset",
        html,
      });
    },
  });
}

export function sendPasswordChangedEmail(to: string) {
  send({
    templateFileName: "password-changed.hbs",
    context: {
      baseUrl,
      projectName,
    },
    callback: async (html) => {
      await transporter.sendMail({
        from: noReplyEmail,
        to,
        subject: "Password change successful",
        html,
      });
    },
  });
}

export function sendAccountDeletedEmail(to: string) {
  send({
    templateFileName: "account-deleted.hbs",
    context: {
      baseUrl,
      projectName,
    },
    callback: async (html) => {
      await transporter.sendMail({
        from: noReplyEmail,
        to,
        subject: "Account deleted",
        html,
      });
    },
  });
}

export function sendOrganizationInvitationEmail(
  to: string,
  details: {
    organizationName: string;
    organizationSlug: string;
    invitedByUsername: string;
    invitedByEmail: string;
    inviteLink: string;
  },
) {
  send({
    templateFileName: "organization-invitation.hbs",
    context: {
      baseUrl,
      orgBaseUrl: `${baseUrl}/${details.organizationSlug}`,
      projectName,
      ...details,
    },
    callback: async (html) => {
      await transporter.sendMail({
        from: noReplyEmail,
        to,
        subject: `Invitation to ${details.organizationName}`,
        html,
      });
    },
  });
}

export function sendMemberRolesChangedEmail(
  to: string,
  { roles, organizationName }: { roles: string[]; organizationName: string },
) {
  send({
    templateFileName: "roles-changed.hbs",
    context: {
      baseUrl,
      projectName,
      organizationName,
      roles: roles.map((r) => (orgRolesObject as any)[r]).join(", "),
    },
    callback: async (html) => {
      await transporter.sendMail({
        from: noReplyEmail,
        to,
        subject: "Roles changed",
        html,
      });
    },
  });
}

export function sendContestSubmittedEmail(
  recipients: string[],
  {
    contest,
    creator,
    regionName,
    organization,
  }: { contest: SelectContest; creator: string; regionName: string | undefined; organization: OrganizationDetails },
) {
  const urgent = getIsUrgent(new Date(contest.startDate));

  send({
    templateFileName: "contest-submitted.hbs",
    context: {
      baseUrl,
      projectName,
      competitionId: contest.competitionId,
      contestName: contest.name,
      contestType: contest.type,
      wcaCompetition: contest.type === "wca-comp",
      contestUrl: `${baseUrl}/${organization.slug}/competitions/${contest.competitionId}`,
      rulesUrl: `${baseUrl}/${organization.slug}/rules`,
      creator,
      startDate: contest.startDate.toDateString(),
      location: regionName ? `${contest.city}, ${regionName}` : "",
      urgent,
    },
    callback: async (html) => {
      const adminEmail = { name: "Admin", address: organization.metadata.contactEmail };
      const subject = `${urgent ? "Urgent: " : ""}Contest submitted: ${contest.shortName}`;

      if (recipients.length > 0) {
        await transporter.sendMail({
          from: contestsEmail,
          replyTo: adminEmail,
          to: recipients,
          bcc: adminEmail,
          subject,
          html,
          priority: urgent ? "high" : "normal",
        });
      } else {
        await transporter.sendMail({
          from: contestsEmail,
          to: adminEmail,
          subject,
          html,
          priority: urgent ? "high" : "normal",
        });
      }
    },
  });
}

export function sendContestApprovedEmail(
  to: string,
  {
    contest,
    organization,
  }: { contest: Pick<SelectContest, "competitionId" | "name" | "shortName">; organization: OrganizationDetails },
) {
  send({
    templateFileName: "contest-approved.hbs",
    context: {
      projectName,
      contestName: contest.name,
      contestUrl: `${baseUrl}/${organization.slug}/competitions/${contest.competitionId}`,
    },
    callback: async (html) => {
      await transporter.sendMail({
        from: contestsEmail,
        to,
        subject: `Contest approved: ${contest.shortName}`,
        html,
      });
    },
  });
}

export function sendContestFinishedEmail(
  recipients: string[],
  {
    contest,
    organization,
  }: {
    contest: Pick<SelectContest, "competitionId" | "name" | "shortName" | "type" | "participants">;
    organization: OrganizationDetails;
  },
) {
  send({
    templateFileName: "contest-finished.hbs",
    context: {
      projectName,
      showDonationLinks: organization.metadata.showDonationLinks,
      contestName: contest.name,
      contestUrl: `${baseUrl}/${organization.slug}/competitions/${contest.competitionId}`,
      rrDonationLink: C.rrDonationLink,
      isUnofficialCompetition: contest.type === "comp",
    },
    callback: async (html) => {
      const adminEmail = { name: "Admin", address: organization.metadata.contactEmail };
      const subject = `Contest finished: ${contest.shortName}`;

      if (recipients.length > 0) {
        await transporter.sendMail({
          from: contestsEmail,
          replyTo: adminEmail,
          to: recipients,
          bcc: adminEmail,
          subject,
          html,
        });
      } else {
        await transporter.sendMail({
          from: contestsEmail,
          to: adminEmail,
          subject,
          html,
        });
      }
    },
  });
}

export function sendContestPublishedEmail(
  to: string,
  {
    contest,
    organization,
  }: { contest: Pick<SelectContest, "competitionId" | "name" | "shortName">; organization: OrganizationDetails },
) {
  send({
    templateFileName: "contest-published.hbs",
    context: {
      projectName,
      contestName: contest.name,
      contestUrl: `${baseUrl}/${organization.slug}/competitions/${contest.competitionId}`,
    },
    callback: async (html) => {
      await transporter.sendMail({
        from: contestsEmail,
        to,
        subject: `Contest published: ${contest.shortName}`,
        html,
      });
    },
  });
}

export function sendVideoBasedResultSubmittedEmail(
  to: string,
  {
    event,
    result,
    creatorName,
    creatorPersonName,
    organization,
  }: {
    event: SelectEvent;
    result: ResultResponse;
    creatorName: string;
    creatorPersonName: string | undefined;
    organization: OrganizationDetails;
  },
) {
  send({
    templateFileName: "video-based-result-submitted.hbs",
    context: {
      projectName,
      eventName: event.name,
      roundFormat: videoBasedFormats.find((rf) => rf.attempts === result.attempts.length)!.label,
      best:
        getFormattedTime(result.best, { event, showMultiPoints: true }) +
        (result.regionalSingleRecord ? ` (${result.regionalSingleRecord})` : ""),
      average:
        result.average !== 0
          ? getFormattedTime(result.average, { event, isAverage: true }) +
            (result.regionalAverageRecord ? ` (${result.regionalAverageRecord})` : "")
          : "",
      videoLink: result.videoLink!,
      discussionLink: result.discussionLink ?? "",
      creatorName,
      creatorPersonName: creatorPersonName ?? "",
    },
    callback: async (html) => {
      const contactEmail = (await getSettingFromDb({
        key: "video-based-results-contact-email",
        organizationId: organization.id,
        optional: true,
      })) ?? {
        name: "Admin",
        address: organization.metadata.contactEmail,
      };

      await transporter.sendMail({
        from: resultsEmail,
        replyTo: contactEmail,
        to,
        bcc: contactEmail,
        subject: `Result submitted: ${event.name}`,
        html,
      });
    },
  });
}

export function sendVideoBasedResultApprovedEmail(
  to: string,
  { event, organization }: { event: SelectEvent; organization: OrganizationDetails },
) {
  send({
    templateFileName: "video-based-result-approved.hbs",
    context: {
      orgBaseUrl: `${baseUrl}/${organization.slug}`,
      projectName,
      eventId: event.eventId,
      eventName: event.name,
    },
    callback: async (html) => {
      await transporter.sendMail({
        from: resultsEmail,
        to,
        subject: `Result approved`,
        html,
      });
    },
  });
}

export function sendMemberRequestSubmittedEmail(
  to: string,
  {
    name,
    requestedPerson,
    requestedRole,
    comment,
    organization,
  }: {
    name: string;
    requestedPerson: Pick<SelectPerson, "id" | "name"> | undefined;
    requestedRole: string | null;
    comment: string | null;
    organization: OrganizationDetails;
  },
) {
  send({
    templateFileName: "member-request-submitted.hbs",
    context: {
      projectName,
      name,
      requestedPersonId: requestedPerson?.id ?? "",
      requestedPersonName: requestedPerson?.name ?? "",
      requestedRole: requestedRole ?? "",
      comment: comment ?? "",
    },
    callback: async (html) => {
      const adminEmail = { name: "Admin", address: organization.metadata.contactEmail };

      await transporter.sendMail({
        from: noReplyEmail,
        replyTo: adminEmail,
        to,
        bcc: adminEmail,
        subject: "User request submitted",
        html,
      });
    },
  });
}
