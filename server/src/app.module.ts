import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MongooseModule } from '@nestjs/mongoose';
import { ContestsModule } from './modules/contests/contests.module';
import { PersonsModule } from './modules/persons/persons.module';
import { EventsModule } from './modules/events/events.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RecordTypesModule } from './modules/record-types/record-types.module';
import { ResultsModule } from './modules/results/results.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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
    ContestsModule,
    PersonsModule,
    EventsModule,
    UsersModule,
    AuthModule,
    RecordTypesModule,
    ResultsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
