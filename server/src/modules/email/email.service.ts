import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { MyLogger } from '@m/my-logger/my-logger.service';
import { LogType } from '~/src/helpers/enums';

@Injectable()
export class EmailService {
  constructor(private readonly logger: MyLogger, private readonly mailerService: MailerService) {}

  // The recipient can either be specified with the email or the username
  async sendEmail(to: string, text: string, { subject = '' }: { subject?: string }) {
    try {
      await this.mailerService.sendMail({
        to, // list of receivers
        subject,
        template: './default', // refers to templates/default.hbs
        context: {
          text,
        },
      });
    } catch (err) {
      this.logger.logAndSave(`Error while sending email:, ${err}`, LogType.Error);
    }
  }

  async sendEmailConfirmationCode(to: string, code: string) {
    try {
      await this.mailerService.sendMail({
        to,
        subject: 'Email Confirmation',
        template: './email-confirmation',
        context: {
          code,
        },
      });
    } catch (err) {
      this.logger.logAndSave(`Error while sending email confirmation code:, ${err}`, LogType.Error);
    }
  }
}
