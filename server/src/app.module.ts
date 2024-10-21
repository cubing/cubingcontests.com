import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from '@m/my-logger/my-logger.module';
import { ContestsModule } from './modules/contests/contests.module';
import { PersonsModule } from './modules/persons/persons.module';
import { EventsModule } from './modules/events/events.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RecordTypesModule } from './modules/record-types/record-types.module';
import { ResultsModule } from './modules/results/results.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LogSchema } from '~/src/models/log.model';
import { ContestSchema } from '~/src/models/contest.model';
import { RoundSchema } from '~/src/models/round.model';
import { EmailModule } from '~/src/modules/email/email.module';
import { CollectiveSolutionModule } from './modules/collective-solution/collective-solution.module';

const mongoUri = process.env.NODE_ENV === 'production'
  ? `mongodb://${process.env.MONGO_DEV_USERNAME}:${process.env.MONGO_DEV_PASSWORD}@cc-mongo:27017/cubingcontests`
  : `mongodb://${process.env.MONGO_DEV_USERNAME}:${process.env.MONGO_DEV_PASSWORD}@127.0.0.1:27017/cubingcontests`;

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.dev',
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
      serveRoot: '/api',
    }),
    MongooseModule.forRoot(mongoUri),
    MongooseModule.forFeature([
      { name: 'Log', schema: LogSchema },
      { name: 'Competition', schema: ContestSchema },
      { name: 'Round', schema: RoundSchema },
    ]),
    LoggerModule,
    ContestsModule,
    PersonsModule,
    EventsModule,
    UsersModule,
    AuthModule,
    RecordTypesModule,
    ResultsModule,
    EmailModule,
    CollectiveSolutionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
