import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(to: string, text: string, { subject = '' }: { subject?: string }) {
    await this.mailerService.sendMail({
      to, // list of receivers
      subject: subject,
      template: './default', // refers to templates/default.hbs
      context: {
        text,
      },
    });
  }
}
