import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { IUser } from "~/helpers/types";
import { Role } from "~/helpers/enums";

@Schema({ timestamps: true })
class UserModel implements IUser {
  @Prop()
  personId?: number;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, type: [{ type: String, enum: Role }] })
  roles: Role[];

  @Prop()
  confirmationCodeHash?: string;

  @Prop()
  confirmationCodeAttempts?: number;

  @Prop()
  cooldownStarted?: Date;

  @Prop()
  passwordResetCodeHash?: string;

  @Prop()
  passwordResetStarted?: Date;
}

export type UserDocument = HydratedDocument<UserModel>;

export const UserSchema = SchemaFactory.createForClass(UserModel);
