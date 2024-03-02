import * as path from 'path';
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { EmailService } from '@m/email/email.service';
import { ConfigModule } from '@nestjs/config';

const getEmail = (baseUrl: string) => `no-reply@${baseUrl.split('://')[1]}`;

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.dev',
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_URL,
        port: process.env.NODE_ENV === 'production' ? 465 : 587,
        secure: process.env.NODE_ENV === 'production',
        auth: {
          user: getEmail(process.env.BASE_URL),
          pass: process.env.EMAIL_PASSWORD,
        },
      },
      defaults: {
        from: `"No Reply" ${getEmail(process.env.BASE_URL)}`,
      },
      template: {
        // The path is like this cause of the dist structure after the Nest build step
        dir: path.resolve('./dist/modules/email/templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
