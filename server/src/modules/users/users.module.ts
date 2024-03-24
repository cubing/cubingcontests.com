import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '~/src/models/user.model';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PersonsModule } from '@m/persons/persons.module';
import { LoggerModule } from '@m/my-logger/my-logger.module';
import { EmailModule } from '~/src/modules/email/email.module';

@Module({
  imports: [
    LoggerModule,
    PersonsModule,
    EmailModule,
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
