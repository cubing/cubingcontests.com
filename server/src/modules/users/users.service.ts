import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '~/src/models/user.model';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly model: Model<User>) {}

  async getUser(username: string): Promise<UserDocument | undefined> {
    try {
      return this.model.findOne({ username }).exec();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async createUser(createUserDto: CreateUserDto) {
    try {
      const user: UserDocument = await this.getUser(createUserDto.username);

      if (user) {
        throw new BadRequestException(`User with username ${createUserDto.username} already exists`);
      }

      const newUser = new this.model(createUserDto);
      await newUser.save();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
