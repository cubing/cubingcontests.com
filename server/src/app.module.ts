import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompetitionsModule } from './competitions/competitions.module';
import { PersonsModule } from './persons/persons.module';
import { EventsModule } from './events/events.module';

const dbURI = process.env.MONGODB_URI || 'mongodb://mongoadmindev:mongoadmindev123@localhost:27017/admin';

@Module({
  imports: [MongooseModule.forRoot(dbURI), CompetitionsModule, PersonsModule, EventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
