import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { LogType } from "../helpers/enums";

@Schema({ timestamps: true })
export class Log {
  @Prop({ required: true })
  message: string;

  @Prop({ enum: LogType, required: true })
  type: LogType;
}

export type LogDocument = HydratedDocument<Log>;

export const LogSchema = SchemaFactory.createForClass(Log);
