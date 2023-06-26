import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import IUser from '@sh/interfaces/User';

@Schema({ timestamps: true })
export class User implements IUser {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);
