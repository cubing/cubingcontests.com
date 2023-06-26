import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompetitionsModule } from './modules/competitions/competitions.module';
import { PersonsModule } from './modules/persons/persons.module';
import { EventsModule } from './modules/events/events.module';

const dbURI = process.env.MONGODB_URI || 'mongodb://mongoadmindev:mongoadmindev123@localhost:27017/admin';

@Module({
  imports: [MongooseModule.forRoot(dbURI), CompetitionsModule, PersonsModule, EventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
