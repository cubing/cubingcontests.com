import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompetitionsModule } from './modules/competitions/competitions.module';
import { PersonsModule } from './modules/persons/persons.module';
import { EventsModule } from './modules/events/events.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RecordTypesModule } from './modules/record-types/record-types.module';
import { ResultsModule } from './modules/results/results.module';

const dbURI =
  process.env.MONGODB_URI ||
  `mongodb://${process.env.MONGO_CC_USERNAME}:${process.env.MONGO_CC_PASSWORD}@127.0.0.1:27017/cubingcontests`;

@Module({
  imports: [
    MongooseModule.forRoot(dbURI),
    CompetitionsModule,
    PersonsModule,
    EventsModule,
    UsersModule,
    AuthModule,
    RecordTypesModule,
    ResultsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
