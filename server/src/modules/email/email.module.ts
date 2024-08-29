import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from '@m/email/email.service';
import { LoggerModule } from '@m/my-logger/my-logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.dev',
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    LoggerModule,
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
