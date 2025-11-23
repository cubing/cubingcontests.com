import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import Handlebars from "handlebars";
import { MailtrapClient } from "mailtrap";
import { C } from "~/helpers/constants.ts";
import { roundFormats } from "~/helpers/roundFormats.ts";
import { getFormattedTime } from "~/helpers/sharedFunctions.ts";
import type { SelectEvent } from "../db/schema/events.ts";
import type { ResultResponse } from "../db/schema/results.ts";

// This is needed when running Better Auth DB migrations
if (process.env.NODE_ENV !== "production") loadEnvConfig(".", true);

// Mailtrap documentation: https://github.com/mailtrap/mailtrap-nodejs
const client = new MailtrapClient({
  token: process.env.EMAIL_API_KEY!,
  sandbox: process.env.NODE_ENV !== "production",
  testInboxId: process.env.NODE_ENV === "production" ? undefined : Number(process.env.EMAIL_TEST_INBOX_ID),
});

const baseUrl = process.env.BASE_URL!;
const from = {
  name: "Cubing Contests",
  email: `no-reply@${process.env.PROD_BASE_URL!.split("://").at(1)}`,
};

async function send({
  templateFileName = "default.hbs",
  context,
  callback,
}: {
  templateFileName?: string;
  context: Record<string, string>;
  callback: (html: string) => Promise<void>;
}) {
  if (!process.env.EMAIL_API_KEY) {
    if (process.env.NODE_ENV !== "production")
      console.log("Not sending email, because EMAIL_API_KEY environment variable isn't set");
    return;
  }

  try {
    const currFilePath = import.meta.url.replace(/^file:/, "");
    const templateContents = await readFile(join(currFilePath, "../templates", templateFileName), "utf-8");
    const template = Handlebars.compile(templateContents, { strict: true });
    const html = template(context);

    await callback(html);
  } catch (err) {
    console.error(`Error while sending email with template ${templateFileName}:`, err);
  }
}

// Email functions

export function sendEmail(to: string, subject: string, content: string) {
  send({
    context: { content },
    callback: async (html) => {
      await client.send({
        from,
        to: [{ email: to }],
        subject,
        html,
      });
    },
  });
}

// This is async, because Better Auth requires an async function
export async function sendVerificationEmail(to: string, url: string) {
  await send({
    templateFileName: "email-verification.hbs",
    context: {
      ccUrl: baseUrl,
      verificationLink: url,
    },
    callback: async (html) => {
      await client.send({
        from,
        to: [{ email: to }],
        subject: "Email verification",
        html,
      });
    },
  });
}

// This is async, because Better Auth requires an async function
export async function sendResetPasswordEmail(to: string, url: string) {
  await send({
    templateFileName: "password-reset-request.hbs",
    context: {
      ccUrl: baseUrl,
      passwordResetLink: url,
    },
    callback: async (html) => {
      await client.send({
        from,
        to: [{ email: to }],
        subject: "Password reset",
        html,
      });
    },
  });
}

// async sendPasswordChangedNotification(to: string) {
//   const contents = await getEmailContents("password-changed.hbs", {
//     ccUrl: process.env.BASE_URL,
//   });

//   try {
//     await this.transporter.sendMail({
//       from: this.sender,
//       to,
//       subject: "Password changed",
//       html: contents,
//     });
//   } catch (err) {
//     this.logger.logAndSave(
//       `Error while sending password changed notification:, ${err}`,
//       LogType.Error,
//     );
//   }
// }

export function sendRoleChangedEmail(to: string, role: string, canAccessModDashboard: boolean) {
  send({
    templateFileName: "role-changed.hbs",
    context: {
      ccUrl: baseUrl,
      role,
      extra: canAccessModDashboard
        ? ` You can now access the <a href="${baseUrl}/mod">Moderator Dashboard</a> from the navigation bar.`
        : "",
    },
    callback: async (html) => {
      await client.send({
        from,
        to: [{ email: to }],
        subject: "Role changed",
        html,
      });
    },
  });
}

// async sendContestSubmittedNotification(
//   to: string,
//   contest: IContest,
//   contestUrl: string,
//   creator: string,
// ) {
//   const urgent = getIsUrgent(new Date(contest.startDate));
//   const contents = await getEmailContents("contest-submitted.hbs", {
//     competitionId: contest.competitionId,
//     wcaCompetition: contest.type === ContestType.WcaComp,
//     contestName: contest.name,
//     contestUrl,
//     ccUrl: process.env.BASE_URL,
//     creator,
//     startDate: new Date(contest.startDate).toDateString(),
//     location: `${contest.city}, ${
//       Countries.find((c) => c.code === contest.countryIso2)?.name ??
//         "NOT FOUND"
//     }`,
//     urgent,
//   });

//   try {
//     await this.transporter.sendMail({
//       from: this.contestsEmail,
//       replyTo: C.contactEmail,
//       to,
//       bcc: C.contactEmail,
//       subject: `Contest submitted: ${contest.shortName}`,
//       html: contents,
//       priority: urgent ? "high" : "normal",
//     });
//   } catch (err) {
//     this.logger.logAndSave(
//       `Error while sending contest submitted notification for contest ${contest.name}: ${err}`,
//       LogType.Error,
//     );
//   }
// }

// async sendContestApprovedNotification(to: string, contest: IContest) {
//   try {
//     await this.transporter.sendMail({
//       from: this.contestsEmail,
//       to,
//       subject: `Contest approved: ${contest.shortName}`,
//       html:
//         `Your contest <a href="${process.env.BASE_URL}/competitions/${contest.competitionId}">${contest.name}</a> has been approved and is now public on the website.`,
//     });
//   } catch (err) {
//     this.logger.logAndSave(
//       `Error while sending contest approved notification for contest: ${err}`,
//       LogType.Error,
//     );
//   }
// }

// async sendContestFinishedNotification(
//   to: string,
//   contest: IContest,
//   contestUrl: string,
//   creator: string,
// ) {
//   const duesAmount = C.duePerCompetitor * contest.participants;
//   const contents = await getEmailContents("contest-finished.hbs", {
//     contestName: contest.name,
//     contestUrl,
//     ccUrl: process.env.BASE_URL,
//     creator,
//     duesAmount: getIsCompType(contest.type) && duesAmount >= 1
//       ? duesAmount.toFixed(2)
//       : undefined,
//     isUnofficialCompetition: contest.type === ContestType.Competition,
//   });

//   try {
//     await this.transporter.sendMail({
//       from: this.contestsEmail,
//       replyTo: C.contactEmail,
//       to,
//       bcc: C.contactEmail,
//       subject: `Contest finished: ${contest.shortName}`,
//       html: contents,
//     });
//   } catch (err) {
//     this.logger.logAndSave(
//       `Error while sending contest finished notification for contest ${contest.name}: ${err}`,
//       LogType.Error,
//     );
//   }
// }

// async sendContestPublishedNotification(to: string, contest: IContest) {
//   try {
//     await this.transporter.sendMail({
//       from: this.contestsEmail,
//       to,
//       subject: `Contest published: ${contest.shortName}`,
//       html:
//         `The results of <a href="${process.env.BASE_URL}/competitions/${contest.competitionId}">${contest.name}</a> have been published and will now enter the rankings.`,
//     });
//   } catch (err) {
//     this.logger.logAndSave(
//       `Error while sending contest published notification for contest: ${err}`,
//       LogType.Error,
//     );
//   }
// }

export function sendVideoBasedResultSubmittedNotification(
  to: string,
  event: SelectEvent,
  result: ResultResponse,
  creatorUsername: string,
) {
  send({
    templateFileName: "video-based-result-submitted.hbs",
    context: {
      ccUrl: baseUrl,
      eventName: event.name,
      roundFormat: roundFormats.find((rf) => rf.value !== "3" && rf.attempts === result.attempts.length)!.label,
      best:
        getFormattedTime(result.best, { event, showMultiPoints: true }) +
        (result.regionalSingleRecord ? ` (${result.regionalSingleRecord})` : ""),
      average:
        result.average !== 0
          ? getFormattedTime(result.average, { event }) +
            (result.regionalAverageRecord ? ` (${result.regionalAverageRecord})` : "")
          : "",
      videoLink: result.videoLink!,
      discussionLink: result.discussionLink ?? "",
      creatorUsername,
    },
    callback: async (html) => {
      await client.send({
        from,
        reply_to: { email: C.contactEmail },
        to: [{ email: to }],
        bcc: [{ email: C.contactEmail }],
        subject: `Result submitted: ${event.name}`,
        html,
      });
    },
  });
}
