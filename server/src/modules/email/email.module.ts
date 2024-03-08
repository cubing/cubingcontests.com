import * as path from 'path';
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from '@m/email/email.service';
import { LoggerModule } from '@m/my-logger/my-logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.dev',
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_URL,
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      },
      defaults: {
        from: `"No Reply" no-reply@${process.env.BASE_URL.split('://')[1]}`,
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
    LoggerModule,
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
