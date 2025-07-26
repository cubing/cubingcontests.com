import { join } from "node:path";
import { readFile } from "fs/promises";
import { createTransport } from "nodemailer";
import Handlebars from "handlebars";
import { Injectable } from "@nestjs/common";
import { MyLogger } from "@m/my-logger/my-logger.service";
import { LogType } from "~/src/helpers/enums";
import { IContest } from "~/helpers/types";
import {
  getIsCompType,
  getIsUrgent,
  getRoleLabel,
} from "~/helpers/sharedFunctions";
import { ContestType, Role } from "~/helpers/enums";
import { C } from "~/helpers/constants";
import { Countries } from "~/helpers/Countries";

// The fileName is the name of a file inside of the templates directory
const getEmailContents = async (
  fileName: string,
  context: any,
): Promise<string> => {
  // The path is like this cause of the dist structure after the Nest build step
  const templateFile = await readFile(
    join("./dist/modules/email/templates", fileName),
    "utf-8",
  );
  const template = Handlebars.compile(templateFile, { strict: true });

  return template(context);
};

@Injectable()
export class EmailService {
  private sender = `"No Reply" no-reply@${
    process.env.BASE_URL.split("://").at(1)
  }`;
  private contestsEmail = `"Contests" contests@${
    process.env.BASE_URL.split("://").at(1)
  }`;
  private transporter = createTransport({
    host: process.env.MAIL_URL,
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  constructor(private readonly logger: MyLogger) {}

  // The recipient can either be specified with the email or the username
  async sendEmail(
    to: string,
    text: string,
    { subject = "" }: { subject?: string },
  ) {
    const contents = await getEmailContents("default.hbs", { text });

    try {
      await this.transporter.sendMail({
        from: this.sender,
        to, // list of receivers
        subject,
        html: contents,
      });
    } catch (err) {
      this.logger.logAndSave(
        `Error while sending email:, ${err}`,
        LogType.Error,
      );
    }
  }

  async sendEmailConfirmationCode(to: string, code: string) {
    const contents = await getEmailContents("email-confirmation.hbs", {
      code,
      ccUrl: process.env.BASE_URL,
    });

    try {
      await this.transporter.sendMail({
        from: this.sender,
        to,
        subject: "Email confirmation",
        html: contents,
      });
    } catch (err) {
      this.logger.logAndSave(
        `Error while sending email confirmation code:, ${err}`,
        LogType.Error,
      );
    }
  }

  async sendPasswordResetCode(to: string, code: string) {
    const contents = await getEmailContents("password-reset-request.hbs", {
      code,
      ccUrl: process.env.BASE_URL,
    });

    try {
      await this.transporter.sendMail({
        from: this.sender,
        to,
        subject: "Password reset request",
        html: contents,
      });
    } catch (err) {
      this.logger.logAndSave(
        `Error while sending password reset link:, ${err}`,
        LogType.Error,
      );
    }
  }

  async sendPasswordChangedNotification(to: string) {
    const contents = await getEmailContents("password-changed.hbs", {
      ccUrl: process.env.BASE_URL,
    });

    try {
      await this.transporter.sendMail({
        from: this.sender,
        to,
        subject: "Password changed",
        html: contents,
      });
    } catch (err) {
      this.logger.logAndSave(
        `Error while sending password changed notification:, ${err}`,
        LogType.Error,
      );
    }
  }

  async sendContestSubmittedNotification(
    to: string,
    contest: IContest,
    contestUrl: string,
    creator: string,
  ) {
    const urgent = getIsUrgent(new Date(contest.startDate));
    const contents = await getEmailContents("contest-submitted.hbs", {
      competitionId: contest.competitionId,
      wcaCompetition: contest.type === ContestType.WcaComp,
      contestName: contest.name,
      contestUrl,
      ccUrl: process.env.BASE_URL,
      creator,
      startDate: new Date(contest.startDate).toDateString(),
      location: `${contest.city}, ${
        Countries.find((c) => c.code === contest.countryIso2)?.name ??
          "NOT FOUND"
      }`,
      urgent,
    });

    try {
      await this.transporter.sendMail({
        from: this.contestsEmail,
        replyTo: C.contactEmail,
        to,
        bcc: C.contactEmail,
        subject: `Contest submitted: ${contest.shortName}`,
        html: contents,
        priority: urgent ? "high" : "normal",
      });
    } catch (err) {
      this.logger.logAndSave(
        `Error while sending contest submitted notification for contest ${contest.name}: ${err}`,
        LogType.Error,
      );
    }
  }

  async sendContestApprovedNotification(to: string, contest: IContest) {
    try {
      await this.transporter.sendMail({
        from: this.contestsEmail,
        to,
        subject: `Contest approved: ${contest.shortName}`,
        html:
          `Your contest <a href="${process.env.BASE_URL}/competitions/${contest.competitionId}">${contest.name}</a> has been approved and is now public on the website.`,
      });
    } catch (err) {
      this.logger.logAndSave(
        `Error while sending contest approved notification for contest: ${err}`,
        LogType.Error,
      );
    }
  }

  async sendContestFinishedNotification(
    to: string,
    contest: IContest,
    contestUrl: string,
  ) {
    const duesAmount = C.duePerCompetitor * contest.participants;
    const contents = await getEmailContents("contest-finished.hbs", {
      contestName: contest.name,
      contestUrl,
      ccUrl: process.env.BASE_URL,
      duesAmount: getIsCompType(contest.type) && duesAmount >= 1
        ? duesAmount.toFixed(2)
        : undefined,
    });

    try {
      await this.transporter.sendMail({
        from: this.contestsEmail,
        replyTo: C.contactEmail,
        to,
        bcc: C.contactEmail,
        subject: `Contest finished: ${contest.shortName}`,
        html: contents,
      });
    } catch (err) {
      this.logger.logAndSave(
        `Error while sending contest finished notification for contest ${contest.name}: ${err}`,
        LogType.Error,
      );
    }
  }

  async sendContestPublishedNotification(to: string, contest: IContest) {
    try {
      await this.transporter.sendMail({
        from: this.contestsEmail,
        to,
        subject: `Contest published: ${contest.shortName}`,
        html:
          `The results of <a href="${process.env.BASE_URL}/competitions/${contest.competitionId}">${contest.name}</a> have been published and will now enter the rankings.`,
      });
    } catch (err) {
      this.logger.logAndSave(
        `Error while sending contest published notification for contest: ${err}`,
        LogType.Error,
      );
    }
  }

  async sendPrivilegesGrantedNotification(to: string, role: Role) {
    const contents = await getEmailContents("privileges-granted.hbs", {
      role: getRoleLabel(role),
      ccUrl: process.env.BASE_URL,
    });

    try {
      await this.transporter.sendMail({
        from: this.sender,
        to,
        subject: "Privileges granted",
        html: contents,
      });
    } catch (err) {
      this.logger.logAndSave(
        `Error while sending contest submitted notification for contest:, ${err}`,
        LogType.Error,
      );
    }
  }
}
