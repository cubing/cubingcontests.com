import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { IAuthToken } from "~/src/helpers/interfaces/AuthToken";

@Schema({ timestamps: true })
export class AuthTokenModel implements IAuthToken {
  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  competitionId: string;
}

export type AuthTokenDocument = HydratedDocument<AuthTokenModel>;

export const AuthTokenSchema = SchemaFactory.createForClass(AuthTokenModel);
