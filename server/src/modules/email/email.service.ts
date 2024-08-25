import { join } from 'path';
import { readFile } from 'fs/promises';
import { createTransport } from 'nodemailer';
import Handlebars from 'handlebars';
import { Injectable } from '@nestjs/common';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { LogType } from '~/src/helpers/enums';
import { IContest } from '@sh/types';
import { getRoleLabel } from '@sh/sharedFunctions';
import { ContestType, Role } from '@sh/enums';

// The fileName is the name of a file inside of the templates directory
const getEmailContents = async (fileName: string, context: any): Promise<string> => {
  // The path is like this cause of the dist structure after the Nest build step
  const templateFile = await readFile(join('./dist/modules/email/templates', fileName), 'utf-8');
  const template = Handlebars.compile(templateFile, { strict: true });

  return template(context);
};

@Injectable()
export class EmailService {
  private sender = `"No Reply" no-reply@${process.env.BASE_URL.split('://')[1]}`;
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
  async sendEmail(to: string, text: string, { subject = '' }: { subject?: string }) {
    const contents = await getEmailContents('default.hbs', { text });

    try {
      await this.transporter.sendMail({
        from: this.sender,
        to, // list of receivers
        subject,
        html: contents,
      });
    } catch (err) {
      this.logger.logAndSave(`Error while sending email:, ${err}`, LogType.Error);
    }
  }

  async sendEmailConfirmationCode(to: string, code: string) {
    const contents = await getEmailContents('email-confirmation.hbs', {
      code,
      ccUrl: process.env.BASE_URL,
    });

    try {
      await this.transporter.sendMail({
        from: this.sender,
        to,
        subject: 'Email confirmation',
        html: contents,
      });
    } catch (err) {
      this.logger.logAndSave(`Error while sending email confirmation code:, ${err}`, LogType.Error);
    }
  }

  async sendPasswordResetCode(to: string, code: string) {
    const contents = await getEmailContents('password-reset-request.hbs', {
      code,
      ccUrl: process.env.BASE_URL,
    });

    try {
      await this.transporter.sendMail({
        from: this.sender,
        to,
        subject: 'Password reset request',
        html: contents,
      });
    } catch (err) {
      this.logger.logAndSave(`Error while sending password reset link:, ${err}`, LogType.Error);
    }
  }

  async sendPasswordChangedNotification(to: string) {
    const contents = await getEmailContents('password-changed.hbs', { ccUrl: process.env.BASE_URL });

    try {
      await this.transporter.sendMail({
        from: this.sender,
        to,
        subject: 'Password changed',
        html: contents,
      });
    } catch (err) {
      this.logger.logAndSave(`Error while sending password changed notification:, ${err}`, LogType.Error);
    }
  }

  async sendContestSubmittedNotification(to: string, contest: IContest, contestUrl: string) {
    const contents = await getEmailContents('contest-submitted.hbs', {
      competitionId: contest.competitionId,
      wcaCompetition: contest.type === ContestType.WcaComp,
      contestName: contest.name,
      contestUrl,
      ccUrl: process.env.BASE_URL,
    });

    try {
      await this.transporter.sendMail({
        from: this.sender,
        to,
        subject: 'Contest submitted',
        html: contents,
      });
    } catch (err) {
      this.logger.logAndSave(
        `Error while sending contest submitted notification for contest ${contest.name}:, ${err}`,
        LogType.Error,
      );
    }
  }

  async sendPrivilegesGrantedNotification(to: string, role: Role) {
    const contents = await getEmailContents('privileges-granted.hbs', {
      role: getRoleLabel(role),
      ccUrl: process.env.BASE_URL,
    });

    try {
      await this.transporter.sendMail({
        from: this.sender,
        to,
        subject: 'Privileges granted',
        html: contents,
      });
    } catch (err) {
      this.logger.logAndSave(`Error while sending contest submitted notification for contest:, ${err}`, LogType.Error);
    }
  }
}
