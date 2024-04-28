import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { ICollectiveSolution } from '@sh/types';

@Schema({ timestamps: true })
export class CollectiveSolution implements ICollectiveSolution {
  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true })
  attemptNumber: number;

  @Prop({ required: true })
  scramble: string;

  @Prop()
  solution: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', required: true })
  lastUserWhoInteracted: mongoose.Types.ObjectId;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: 'User' }], required: true })
  usersWhoMadeMoves: mongoose.Types.ObjectId[];

  @Prop({ required: true })
  state: 10 | 20 | 30;
}

export type CollectiveSolutionDocument = HydratedDocument<CollectiveSolution>;

export const CollectiveSolutionSchema = SchemaFactory.createForClass(CollectiveSolution);
