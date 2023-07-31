import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MongooseModule } from '@nestjs/mongoose';
import { CompetitionsModule } from './modules/competitions/competitions.module';
import { PersonsModule } from './modules/persons/persons.module';
import { EventsModule } from './modules/events/events.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RecordTypesModule } from './modules/record-types/record-types.module';
import { ResultsModule } from './modules/results/results.module';

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
    MongooseModule.forRoot(process.env.MONGODB_URI),
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
